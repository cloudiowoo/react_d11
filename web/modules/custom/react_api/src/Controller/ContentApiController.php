<?php

namespace Drupal\react_api\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\path_alias\AliasManagerInterface;
use Drupal\Core\Language\LanguageManagerInterface;
use Drupal\Core\Entity\EntityFieldManagerInterface;
use Drupal\Core\Url;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Drupal\Core\Cache\CacheBackendInterface;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\node\NodeInterface;
use Drupal\Core\Database\Connection;
use Drupal\Core\Datetime\DateFormatterInterface;
use Drupal\Core\File\FileUrlGeneratorInterface;
use Drupal\Core\Render\RendererInterface;
use Drupal\Core\Session\AccountInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class ContentApiController extends ControllerBase
{

  protected $entityTypeManager;
  protected $aliasManager;
  protected $languageManager;
  protected $entityFieldManager;
  protected $cache;
  protected $configFactory;
  protected $database;
  protected $dateFormatter;
  protected $fileUrlGenerator;
  protected $renderer;
  protected $currentUser;

  public function __construct(
    EntityTypeManagerInterface $entity_type_manager,
    AliasManagerInterface $alias_manager,
    LanguageManagerInterface $language_manager,
    EntityFieldManagerInterface $entity_field_manager,
    CacheBackendInterface $cache,
    ConfigFactoryInterface $config_factory,
    Connection $database,
    DateFormatterInterface $date_formatter,
    FileUrlGeneratorInterface $file_url_generator,
    RendererInterface $renderer,
    AccountInterface $current_user
  ) {
    $this->entityTypeManager = $entity_type_manager;
    $this->aliasManager = $alias_manager;
    $this->languageManager = $language_manager;
    $this->entityFieldManager = $entity_field_manager;
    $this->cache = $cache;
    $this->configFactory = $config_factory;
    $this->database = $database;
    $this->dateFormatter = $date_formatter;
    $this->fileUrlGenerator = $file_url_generator;
    $this->renderer = $renderer;
    $this->currentUser = $current_user;
  }

  public static function create(ContainerInterface $container)
  {
    return new static(
      $container->get('entity_type.manager'),
      $container->get('path_alias.manager'),
      $container->get('language_manager'),
      $container->get('entity_field.manager'),
      $container->get('cache.default'),
      $container->get('config.factory'),
      $container->get('database'),
      $container->get('date.formatter'),
      $container->get('file_url_generator'),
      $container->get('renderer'),
      $container->get('current_user')
    );
  }

  /**
   * 通过页面路径获取内容
   *
   * @param Request $request
   * @param string $page_path 页面路径，如 'home', 'about', 'contact'
   * @return JsonResponse
   */
  public function getPageContent(Request $request, $page_path)
  {
    $language = $request->query->get('lang');

    try {
      // 设置当前语言
      if ($language) {
        $this->setCurrentLanguage($language);
      }

      // 通过路径别名查找页面
      $alias_path = '/' . $page_path;
      $internal_path = $this->aliasManager->getPathByAlias($alias_path);

      if ($internal_path === $alias_path) {
        // 如果没有找到别名，返回错误
        return $this->errorResponse("Page '$page_path' not found", 404);
      }

      // 解析内部路径获取节点ID
      if (preg_match('/^\/node\/(\d+)$/', $internal_path, $matches)) {
        $node_id = $matches[1];
        /** @var \Drupal\node\NodeInterface $node */
        $node = $this->entityTypeManager->getStorage('node')->load($node_id);

        if (!$node || !$node->isPublished()) {
          return $this->errorResponse("Page '$page_path' not found or not published", 404);
        }

        $formatted_data = $this->formatNodeData($node, $language);
        $formatted_data['page_path'] = $page_path;

        return $this->successResponse($formatted_data);
      }

      return $this->errorResponse("Invalid page path: '$page_path'", 400);
    } catch (\Exception $e) {
      return $this->errorResponse($e->getMessage(), 500);
    }
  }

  /**
   * 通过内容类型获取内容列表
   *
   * @param Request $request
   * @param string $content_type 内容类型，如 'product', 'article', 'news'
   * @return JsonResponse
   */
  public function getContentByType(Request $request, $content_type)
  {
    $language = $request->query->get('lang');
    $limit = $request->query->get('limit', 20);
    $offset = $request->query->get('offset', 0);
    $sort = $request->query->get('sort', 'created');
    $order = $request->query->get('order', 'DESC');
    $filters = $request->query->all();

    try {
      // 设置当前语言
      $target_language = $language;
      if ($language) {
        $this->setCurrentLanguage($language);
      }

      // 验证内容类型是否存在
      $node_types = $this->entityTypeManager->getStorage('node_type')->loadMultiple();
      if (!isset($node_types[$content_type])) {
        return $this->errorResponse("Content type '$content_type' not found", 404);
      }

      // 处理排序参数 - 如果以 '-' 开头，表示降序
      if (strpos($sort, '-') === 0) {
        $sort = substr($sort, 1); // 移除 '-' 前缀
        $order = 'DESC';
      }

      // 构建查询
      $query = $this->entityTypeManager->getStorage('node')->getQuery()
        ->condition('type', $content_type)
        ->condition('status', 1) // 只查询已发布的内容
        ->accessCheck(TRUE)
        ->range($offset, $limit)
        ->sort($sort, $order);

      // 如果指定了语言，优先查找该语言的内容
      if ($target_language) {
        $query->condition('langcode', $target_language);
      }

      // 应用额外的过滤条件
      $this->applyFilters($query, $filters, $content_type);

      $node_ids = $query->execute();

      // 如果指定语言没有内容，回退到默认语言
      if (empty($node_ids) && $target_language) {
        $default_language = $this->languageManager->getDefaultLanguage()->getId();
        if ($target_language !== $default_language) {
          $query = $this->entityTypeManager->getStorage('node')->getQuery()
            ->condition('type', $content_type)
            ->condition('status', 1)
            ->condition('langcode', $default_language)
            ->accessCheck(TRUE)
            ->range($offset, $limit)
            ->sort($sort, $order);

          $this->applyFilters($query, $filters, $content_type);
          $node_ids = $query->execute();

          // 如果使用了回退语言，更新目标语言
          if (!empty($node_ids)) {
            $target_language = $default_language;
          }
        }
      }

      $nodes = $this->entityTypeManager->getStorage('node')->loadMultiple($node_ids);

      $formatted_nodes = [];
      foreach ($nodes as $node) {
        $formatted_nodes[] = $this->formatNodeData($node, $target_language);
      }

      // 获取总数（用于分页）
      $total_query = $this->entityTypeManager->getStorage('node')->getQuery()
        ->condition('type', $content_type)
        ->condition('status', 1)
        ->accessCheck(TRUE);

      if ($target_language) {
        $total_query->condition('langcode', $target_language);
      }

      $this->applyFilters($total_query, $filters, $content_type);
      $total = $total_query->count()->execute();

      return $this->successResponse([
        'content_type' => $content_type,
        'items' => $formatted_nodes,
        'requested_language' => $language,
        'returned_language' => $target_language,
        'pagination' => [
          'total' => (int) $total,
          'limit' => (int) $limit,
          'offset' => (int) $offset,
          'has_next' => ($offset + $limit) < $total,
          'has_previous' => $offset > 0,
        ],
      ]);
    } catch (\Exception $e) {
      return $this->errorResponse($e->getMessage(), 500);
    }
  }

  /**
   * 获取单个内容项
   *
   * @param Request $request
   * @param string $content_type
   * @param int $node_id
   * @return JsonResponse
   */
  public function getSingleContent(Request $request, $content_type, $node_id)
  {
    $language = $request->query->get('lang');

    try {
      // 设置当前语言
      if ($language) {
        $this->setCurrentLanguage($language);
      }

      /** @var \Drupal\node\NodeInterface $node */
      $node = $this->entityTypeManager->getStorage('node')->load($node_id);

      if (!$node || !$node->get('status')->value || $node->bundle() !== $content_type) {
        return $this->errorResponse("Content not found", 404);
      }

      // 针对产品类型使用增强的格式化方法
      if ($content_type === 'products') {
        $formatted_data = $this->formatProductData($node, $language);
      } else {
        $formatted_data = $this->formatNodeData($node, $language);
      }

      return $this->successResponse($formatted_data);
    } catch (\Exception $e) {
      return $this->errorResponse($e->getMessage(), 500);
    }
  }

  /**
   * 获取可用的语言列表
   */
  public function getAvailableLanguages()
  {
    $languages = $this->languageManager->getLanguages();
    $language_list = [];

    foreach ($languages as $langcode => $language) {
      $language_list[] = [
        'langcode' => $langcode,
        'name' => $language->getName(),
        'direction' => $language->getDirection(),
        'weight' => $language->getWeight(),
      ];
    }

    return $this->successResponse([
      'languages' => $language_list,
      'default_language' => $this->languageManager->getDefaultLanguage()->getId(),
    ]);
  }

  /**
   * 应用过滤条件到查询
   */
  private function applyFilters(&$query, $filters, $content_type)
  {
    // 移除系统参数
    $system_params = ['lang', 'limit', 'offset', 'sort', 'order'];

    // 处理搜索参数
    $search_query = null;
    if (isset($filters['search']) && !empty($filters['search'])) {
      $search_query = $filters['search'];
      unset($filters['search']);
    }

    foreach ($system_params as $param) {
      unset($filters[$param]);
    }

    // 如果有搜索查询，执行全文搜索
    if ($search_query) {
      $this->applySearchConditions($query, $search_query, $content_type);
    }

    // 获取内容类型的字段定义
    $field_definitions = $this->entityFieldManager->getFieldDefinitions('node', $content_type);

    foreach ($filters as $field_name => $value) {
      if (isset($field_definitions[$field_name]) && !empty($value)) {
        $field_type = $field_definitions[$field_name]->getType();

        switch ($field_type) {
          case 'entity_reference':
            $query->condition($field_name . '.target_id', $value);
            break;

          case 'boolean':
            $query->condition($field_name . '.value', (bool) $value);
            break;

          case 'integer':
          case 'decimal':
          case 'float':
            if (strpos($value, ',') !== FALSE) {
              // 范围查询，如 "10,100"
              $range = explode(',', $value);
              if (count($range) === 2) {
                $query->condition($field_name . '.value', [$range[0], $range[1]], 'BETWEEN');
              }
            } else {
              $query->condition($field_name . '.value', $value);
            }
            break;

          default:
            // 文本字段使用模糊匹配
            $query->condition($field_name . '.value', '%' . $value . '%', 'LIKE');
        }
      }
    }
  }

  /**
   * 应用搜索条件到查询
   */
  private function applySearchConditions(&$query, $search_query, $content_type)
  {
    // 创建OR条件组
    $or_group = $query->orConditionGroup();

    // 搜索标题
    $or_group->condition('title', '%' . $search_query . '%', 'LIKE');

    // 根据内容类型搜索特定字段
    if ($content_type === 'products') {
      // 搜索产品相关字段
      $or_group->condition('field_p_sub_title.value', '%' . $search_query . '%', 'LIKE');
      $or_group->condition('body.value', '%' . $search_query . '%', 'LIKE');
      $or_group->condition('field_p_features.value', '%' . $search_query . '%', 'LIKE');
      $or_group->condition('field_p_information.value', '%' . $search_query . '%', 'LIKE');
      $or_group->condition('field_p_specification.value', '%' . $search_query . '%', 'LIKE');

      // 搜索产品分类名称
      $category_subquery = $this->entityTypeManager->getStorage('taxonomy_term')->getQuery()
        ->condition('vid', 'product_categories')
        ->condition('name', '%' . $search_query . '%', 'LIKE')
        ->accessCheck(TRUE);
      $category_ids = $category_subquery->execute();

      if (!empty($category_ids)) {
        $or_group->condition('field_p_categories.target_id', $category_ids, 'IN');
      }

      // 搜索标签
      $tag_subquery = $this->entityTypeManager->getStorage('taxonomy_term')->getQuery()
        ->condition('vid', 'tags')
        ->condition('name', '%' . $search_query . '%', 'LIKE')
        ->accessCheck(TRUE);
      $tag_ids = $tag_subquery->execute();

      if (!empty($tag_ids)) {
        $or_group->condition('field_tags.target_id', $tag_ids, 'IN');
      }
    } else {
      // 对于其他内容类型，搜索body字段
      $or_group->condition('body.value', '%' . $search_query . '%', 'LIKE');
    }

    // 应用OR条件组到主查询
    $query->condition($or_group);
  }

  /**
   * 格式化节点数据
   *
   * @param \Drupal\node\NodeInterface $node
   * @param string|null $target_language
   * @return array
   */
  private function formatNodeData($node, $target_language = NULL)
  {
    $current_language = $this->languageManager->getCurrentLanguage()->getId();

    // 如果指定了目标语言且节点有该翻译，使用翻译版本
    if ($target_language && $node->hasTranslation($target_language)) {
      /** @var \Drupal\node\NodeInterface $node */
      $node = $node->getTranslation($target_language);
      $current_language = $target_language;
    } elseif ($node->hasTranslation($current_language)) {
      /** @var \Drupal\node\NodeInterface $node */
      $node = $node->getTranslation($current_language);
    }

    $data = [
      'id' => (int) $node->id(),
      'type' => $node->bundle(),
      'title' => $node->getTitle(),
      'language' => $node->language()->getId(),
      'created' => (int) $node->getCreatedTime(),
      'updated' => (int) $node->getChangedTime(),
      'published' => (bool) $node->get('status')->value,
      'author' => [
        'id' => (int) $node->getOwnerId(),
        'name' => $node->getOwner()->getDisplayName(),
      ],
    ];

    // 处理基础字段
    if ($node->hasField('body') && !$node->get('body')->isEmpty()) {
      $body = $node->get('body')->first();
      $data['body'] = [
        'value' => $body->value,
        'processed' => $body->processed,
        'summary' => $body->summary,
        'format' => $body->format,
      ];
    }

    // 处理自定义字段
    $custom_fields = [];
    $field_definitions = $node->getFieldDefinitions();

    foreach ($field_definitions as $field_name => $field_definition) {
      // 只处理自定义字段（以 field_ 开头）
      if (strpos($field_name, 'field_') === 0 && !$node->get($field_name)->isEmpty()) {
        $custom_fields[$field_name] = $this->formatFieldValue($node->get($field_name));
      }
    }

    if (!empty($custom_fields)) {
      $data['fields'] = $custom_fields;
    }

    // 添加翻译信息
    $translations = [];
    foreach ($node->getTranslationLanguages() as $langcode => $language) {
      /** @var \Drupal\node\NodeInterface $translated_node */
      $translated_node = $node->getTranslation($langcode);
      $translations[] = [
        'langcode' => $langcode,
        'name' => $language->getName(),
        'title' => $translated_node->getTitle(),
        'published' => (bool) $translated_node->get('status')->value,
      ];
    }
    $data['translations'] = $translations;

    // 添加URL信息
    $data['urls'] = $this->generateUrls($node);

    // 添加简化的url字段用于导航（从urls中提取canonical URL）
    $urls = $data['urls'];

    // 尝试获取当前语言的canonical URL，如果不存在则使用第一个可用的
    if (isset($urls[$current_language]['canonical'])) {
      $data['url'] = $urls[$current_language]['canonical'];
    } elseif (isset($urls['en']['canonical'])) {
      // 备用：使用英文版本
      $data['url'] = $urls['en']['canonical'];
    } elseif (!empty($urls)) {
      // 备用：使用第一个可用的canonical URL
      $first_lang = array_key_first($urls);
      if (isset($urls[$first_lang]['canonical'])) {
        $data['url'] = $urls[$first_lang]['canonical'];
      }
    }

    return $data;
  }

  /**
   * 格式化字段值
   */
  private function formatFieldValue($field)
  {
    $field_type = $field->getFieldDefinition()->getType();

    switch ($field_type) {
      case 'text_long':
      case 'text_with_summary':
        $first = $field->first();
        return [
          'value' => $first->value,
          'processed' => $first->processed,
          'summary' => $first->summary ?? null,
          'format' => $first->format,
        ];

      case 'image':
        $values = [];
        foreach ($field as $item) {
          if ($item->entity) {
            $file_uri = $item->entity->getFileUri();
            $image_data = [
              'url' => \Drupal::service('file_url_generator')->generateAbsoluteString($file_uri),
              'alt' => $item->alt,
              'title' => $item->title,
              'width' => $item->width,
              'height' => $item->height,
              'filesize' => $item->entity->getSize(),
              'mime_type' => $item->entity->getMimeType(),
            ];

            // 添加图片样式支持
            $image_styles = [];
            $style_storage = \Drupal::entityTypeManager()->getStorage('image_style');

            // 获取所有可用的图片样式
            $available_styles = $style_storage->loadMultiple();

            foreach ($available_styles as $style_id => $style) {
              $style_url = $style->buildUrl($file_uri);
              $image_styles[$style_id] = \Drupal::service('file_url_generator')->generateAbsoluteString($style_url);
            }

            // 添加图片样式到返回数据
            $image_data['image_styles'] = $image_styles;

            $values[] = $image_data;
          }
        }
        return $values;

      case 'file':
        $values = [];
        foreach ($field as $item) {
          if ($item->entity) {
            $file_uri = $item->entity->getFileUri();
            $values[] = [
              'url' => \Drupal::service('file_url_generator')->generateAbsoluteString($file_uri),
              'filename' => $item->entity->getFilename(),
              'filesize' => $item->entity->getSize(),
              'mime_type' => $item->entity->getMimeType(),
              'description' => $item->description,
            ];
          }
        }
        return $values;

      case 'entity_reference':
        $values = [];
        foreach ($field as $item) {
          if ($item->entity) {
            $referenced_entity = $item->entity;

            // 获取当前语言
            $current_language = $this->languageManager->getCurrentLanguage()->getId();

            // 如果实体有当前语言的翻译，使用翻译版本
            if ($referenced_entity->hasTranslation($current_language)) {
              $referenced_entity = $referenced_entity->getTranslation($current_language);
            }

            $entity_data = [
              'target_id' => (int) $referenced_entity->id(),
              'id' => (int) $referenced_entity->id(),
              'type' => $referenced_entity->getEntityTypeId(),
              'bundle' => $referenced_entity->bundle(),
              'label' => $referenced_entity->label(),
              'uuid' => $referenced_entity->uuid(),
            ];

            // 特殊处理媒体实体
            if ($referenced_entity->getEntityTypeId() === 'media') {
              /** @var \Drupal\media\MediaInterface $media */
              $media = $referenced_entity;

              // 获取媒体包类型
              $media_bundle = $media->bundle();

              if ($media_bundle === 'image') {
                // 处理图片媒体 - 尝试常见的图片字段名称
                $possible_image_fields = ['field_media_image', 'image', 'field_image'];

                foreach ($possible_image_fields as $field_name) {
                  if ($media->hasField($field_name) && !$media->get($field_name)->isEmpty()) {
                    $image_item = $media->get($field_name)->first();
                    if ($image_item && $image_item->entity) {
                      $file_uri = $image_item->entity->getFileUri();

                      $entity_data['image'] = [
                        'url' => \Drupal::service('file_url_generator')->generateAbsoluteString($file_uri),
                        'alt' => $image_item->alt ?? '',
                        'title' => $image_item->title ?? '',
                        'width' => $image_item->width ?? null,
                        'height' => $image_item->height ?? null,
                        'filesize' => $image_item->entity->getSize(),
                        'mime_type' => $image_item->entity->getMimeType(),
                      ];

                      // 添加图片样式支持
                      $image_styles = [];
                      $style_storage = \Drupal::entityTypeManager()->getStorage('image_style');
                      $available_styles = $style_storage->loadMultiple();

                      foreach ($available_styles as $style_id => $style) {
                        $style_url = $style->buildUrl($file_uri);
                        $image_styles[$style_id] = \Drupal::service('file_url_generator')->generateAbsoluteString($style_url);
                      }

                      $entity_data['image']['image_styles'] = $image_styles;
                      break; // 找到图片字段后退出循环
                    }
                  }
                }
              } elseif ($media_bundle === 'document' || $media_bundle === 'file') {
                // 处理文档/文件媒体 - 尝试常见的文件字段名称
                $possible_file_fields = ['field_media_document', 'field_media_file', 'document', 'file'];

                foreach ($possible_file_fields as $field_name) {
                  if ($media->hasField($field_name) && !$media->get($field_name)->isEmpty()) {
                    $file_item = $media->get($field_name)->first();
                    if ($file_item && $file_item->entity) {
                      $file_uri = $file_item->entity->getFileUri();

                      $entity_data['file'] = [
                        'url' => \Drupal::service('file_url_generator')->generateAbsoluteString($file_uri),
                        'filename' => $file_item->entity->getFilename(),
                        'filesize' => $file_item->entity->getSize(),
                        'mime_type' => $file_item->entity->getMimeType(),
                        'description' => $file_item->description ?? '',
                      ];
                      break; // 找到文件字段后退出循环
                    }
                  }
                }
              }
            }

            // 特殊处理 taxonomy_term
            if ($referenced_entity->getEntityTypeId() === 'taxonomy_term') {
              // 添加颜色代码字段（如果存在）
              if ($referenced_entity->hasField('field_t_code') && !$referenced_entity->get('field_t_code')->isEmpty()) {
                $entity_data['color_code'] = $referenced_entity->get('field_t_code')->value;
              }

              // 可以添加其他taxonomy term的自定义字段
              // 例如：描述、图片等
              if ($referenced_entity->hasField('description') && !$referenced_entity->get('description')->isEmpty()) {
                $description = $referenced_entity->get('description')->first();
                $entity_data['description'] = [
                  'value' => $description->value,
                  'processed' => $description->processed,
                  'format' => $description->format,
                ];
              }
            }

            $values[] = $entity_data;
          }
        }
        // 对于单个分类字段，仍然返回单个对象而不是数组，但确保包含target_id
        return count($values) === 1 ? $values[0] : $values;

      case 'entity_reference_revisions':
        // 处理 Paragraphs 字段
        $values = [];
        foreach ($field as $item) {
          if ($item->entity) {
            $paragraph = $item->entity;
            $paragraph_data = [
              'id' => (int) $paragraph->id(),
              'type' => $paragraph->bundle(),
              'uuid' => $paragraph->uuid(),
            ];

            // 获取段落的所有字段
            $paragraph_fields = [];
            $field_definitions = $paragraph->getFieldDefinitions();

            foreach ($field_definitions as $field_name => $field_definition) {
              // 跳过系统字段
              if (in_array($field_name, ['id', 'revision_id', 'uuid', 'langcode', 'type', 'status', 'created', 'parent_id', 'parent_type', 'parent_field_name', 'behavior_settings', 'default_langcode', 'revision_default', 'revision_translation_affected'])) {
                continue;
              }

              if (!$paragraph->get($field_name)->isEmpty()) {
                $paragraph_fields[$field_name] = $this->formatFieldValue($paragraph->get($field_name));
              }
            }

            $paragraph_data['fields'] = $paragraph_fields;
            $values[] = $paragraph_data;
          }
        }
        return $values;

      case 'datetime':
        $values = [];
        foreach ($field as $item) {
          $values[] = [
            'value' => $item->value,
            'timestamp' => strtotime($item->value),
            'formatted' => $item->date->format('Y-m-d H:i:s'),
          ];
        }
        return count($values) === 1 ? $values[0] : $values;

      case 'boolean':
        return (bool) $field->value;

      case 'integer':
        return (int) $field->value;

      case 'decimal':
      case 'float':
        return (float) $field->value;

      case 'list_string':
      case 'list_integer':
        $values = [];
        foreach ($field as $item) {
          $values[] = $item->value;
        }
        return count($values) === 1 ? $values[0] : $values;

      default:
        // 默认返回原始值
        $values = [];
        foreach ($field as $item) {
          $values[] = $item->value;
        }
        return count($values) === 1 ? $values[0] : $values;
    }
  }

  /**
   * 生成各种URL
   */
  private function generateUrls($node)
  {
    $urls = [];

    // 获取当前节点的所有翻译的URL
    foreach ($node->getTranslationLanguages() as $langcode => $language) {
      $translated_node = $node->getTranslation($langcode);
      if ($translated_node->isPublished()) {
        $urls[$langcode] = [
          'canonical' => $translated_node->toUrl('canonical', ['absolute' => TRUE])->toString(),
          'edit' => $translated_node->toUrl('edit-form', ['absolute' => TRUE])->toString(),
          'api' => Url::fromRoute('react_api.single_content', [
            'content_type' => $node->bundle(),
            'node_id' => $node->id(),
          ], [
            'absolute' => TRUE,
            'query' => ['lang' => $langcode],
          ])->toString(),
        ];
      }
    }

    return $urls;
  }

  /**
   * 设置当前语言
   */
  private function setCurrentLanguage($langcode)
  {
    $language = $this->languageManager->getLanguage($langcode);
    if ($language) {
      $this->languageManager->setConfigOverrideLanguage($language);
    }
  }

  /**
   * 成功响应格式
   */
  private function successResponse($data, $status_code = 200)
  {
    $response_data = [
      'success' => TRUE,
      'data' => $data,
      'timestamp' => time(),
    ];

    $response = new JsonResponse($response_data, $status_code);

    // 添加CORS头
    $response->headers->set('Access-Control-Allow-Origin', '*');
    $response->headers->set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return $response;
  }

  /**
   * 错误响应格式
   */
  private function errorResponse($message, $status_code = 400)
  {
    $response_data = [
      'success' => FALSE,
      'error' => [
        'message' => $message,
        'code' => $status_code,
      ],
      'timestamp' => time(),
    ];

    $response = new JsonResponse($response_data, $status_code);

    // 添加CORS头
    $response->headers->set('Access-Control-Allow-Origin', '*');
    $response->headers->set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return $response;
  }

  /**
   * 专门为产品详情页面格式化产品数据
   */
  private function formatProductData($node, $target_language = NULL)
  {
    $current_language = $this->languageManager->getCurrentLanguage()->getId();

    // 如果指定了目标语言且节点有该翻译，使用翻译版本
    if ($target_language && $node->hasTranslation($target_language)) {
      /** @var \Drupal\node\NodeInterface $node */
      $node = $node->getTranslation($target_language);
      $current_language = $target_language;
    } elseif ($node->hasTranslation($current_language)) {
      /** @var \Drupal\node\NodeInterface $node */
      $node = $node->getTranslation($current_language);
    }

    $data = [
      'id' => (int) $node->id(),
      'type' => $node->bundle(),
      'title' => $node->getTitle(),
      'language' => $node->language()->getId(),
      'created' => (int) $node->getCreatedTime(),
      'updated' => (int) $node->getChangedTime(),
      'published' => (bool) $node->get('status')->value,
      'author' => [
        'id' => (int) $node->getOwnerId(),
        'name' => $node->getOwner()->getDisplayName(),
      ],
    ];

    // 处理产品特定字段
    $fields = [];

    // 处理产品属性/变体 (field_p_attributes)
    if ($node->hasField('field_p_attributes') && !$node->get('field_p_attributes')->isEmpty()) {
      $attributes = [];
      foreach ($node->get('field_p_attributes') as $item) {
        if ($item->entity) {
          $variant = $item->entity;
          $variant_data = [
            'id' => (int) $variant->id(),
            'type' => $variant->bundle(),
            'uuid' => $variant->uuid(),
            'fields' => []
          ];

          // 获取变体的所有字段
          $field_definitions = $variant->getFieldDefinitions();
          foreach ($field_definitions as $field_name => $field_definition) {
            // 跳过系统字段
            if (in_array($field_name, ['id', 'revision_id', 'uuid', 'langcode', 'type', 'status', 'created', 'parent_id', 'parent_type', 'parent_field_name', 'behavior_settings', 'default_langcode', 'revision_default', 'revision_translation_affected'])) {
              continue;
            }

            if (!$variant->get($field_name)->isEmpty()) {
              $variant_data['fields'][$field_name] = $this->formatFieldValue($variant->get($field_name));
            }
          }

          $attributes[] = $variant_data;
        }
      }
      $fields['field_p_attributes'] = $attributes;
    }

    // 处理产品分类 (field_p_categories)
    if ($node->hasField('field_p_categories') && !$node->get('field_p_categories')->isEmpty()) {
      $fields['field_p_categories'] = $this->formatFieldValue($node->get('field_p_categories'));
    }

    // 处理产品特性 (field_p_features) - 直接返回text_long完整内容
    if ($node->hasField('field_p_features') && !$node->get('field_p_features')->isEmpty()) {
      $fields['field_p_features'] = $this->formatFieldValue($node->get('field_p_features'));
    }

    // 处理产品信息 (field_p_information) - 直接返回text_long完整内容
    if ($node->hasField('field_p_information') && !$node->get('field_p_information')->isEmpty()) {
      $fields['field_p_information'] = $this->formatFieldValue($node->get('field_p_information'));
    }

    // 处理产品规格 (field_p_specification) - 直接返回text_long完整内容
    if ($node->hasField('field_p_specification') && !$node->get('field_p_specification')->isEmpty()) {
      $fields['field_p_specification'] = $this->formatFieldValue($node->get('field_p_specification'));
    }

    // 处理产品价格 (field_p_price)
    if ($node->hasField('field_p_price') && !$node->get('field_p_price')->isEmpty()) {
      $fields['field_p_price'] = (float) $node->get('field_p_price')->value;
    }

    // 处理产品副标题 (field_p_sub_title)
    if ($node->hasField('field_p_sub_title') && !$node->get('field_p_sub_title')->isEmpty()) {
      $fields['field_p_sub_title'] = $node->get('field_p_sub_title')->value;
    }

    // 处理产品手册 (field_p_manual)
    if ($node->hasField('field_p_manual') && !$node->get('field_p_manual')->isEmpty()) {
      $fields['field_p_manual'] = $this->formatFieldValue($node->get('field_p_manual'));
    }

    // 处理主图片字段 (field_image)
    if ($node->hasField('field_image') && !$node->get('field_image')->isEmpty()) {
      $fields['field_image'] = $this->formatFieldValue($node->get('field_image'));
    }

    // 处理标签 (field_tags)
    if ($node->hasField('field_tags') && !$node->get('field_tags')->isEmpty()) {
      $fields['field_tags'] = $this->formatFieldValue($node->get('field_tags'));
    }

    // 处理body字段
    if ($node->hasField('body') && !$node->get('body')->isEmpty()) {
      $body = $node->get('body')->first();
      $data['body'] = [
        'value' => $body->value,
        'processed' => $body->processed,
        'summary' => $body->summary,
        'format' => $body->format,
      ];
    }

    $data['fields'] = $fields;

    // 添加翻译信息
    $translations = [];
    foreach ($node->getTranslationLanguages() as $langcode => $language) {
      /** @var \Drupal\node\NodeInterface $translated_node */
      $translated_node = $node->getTranslation($langcode);
      $translations[] = [
        'langcode' => $langcode,
        'name' => $language->getName(),
        'title' => $translated_node->getTitle(),
        'published' => (bool) $translated_node->get('status')->value,
      ];
    }
    $data['translations'] = $translations;

    // 添加URL信息
    $data['urls'] = $this->generateUrls($node);

    // 添加产品特定的辅助数据
    $data['product_helpers'] = $this->getProductHelpers($node);

    return $data;
  }

  /**
   * 获取产品辅助数据（颜色选项、推荐产品等）
   */
  private function getProductHelpers($node)
  {
    $helpers = [];

    // 从变体中提取颜色选项
    $color_options = [];
    if ($node->hasField('field_p_attributes') && !$node->get('field_p_attributes')->isEmpty()) {
      foreach ($node->get('field_p_attributes') as $item) {
        if ($item->entity) {
          $variant = $item->entity;
          // 检查是否有颜色字段
          if ($variant->hasField('field_v_color') && !$variant->get('field_v_color')->isEmpty()) {
            $color_term = $variant->get('field_v_color')->entity;
            if ($color_term) {
              $color_options[] = [
                'id' => (int) $color_term->id(),
                'name' => $color_term->getName(),
                'label' => $color_term->label(),
                // 如果有颜色代码字段，可以在这里添加
              ];
            }
          }
        }
      }
    }
    $helpers['color_options'] = $color_options;

    // 获取同类产品推荐（简化版本）
    try {
      $current_category = null;
      if ($node->hasField('field_p_categories') && !$node->get('field_p_categories')->isEmpty()) {
        $category_term = $node->get('field_p_categories')->entity;
        if ($category_term) {
          $current_category = $category_term->id();
        }
      }

      $recommended_products = [];
      if ($current_category) {
        // 查询相同分类的其他产品 - 按标题排序，排除当前产品
        $query = $this->entityTypeManager->getStorage('node')->getQuery()
          ->condition('type', 'products')
          ->condition('status', 1)
          ->condition('field_p_categories', $current_category)
          ->condition('nid', $node->id(), '!=')  // 排除当前产品
          ->accessCheck(TRUE)
          ->range(0, 6)
          ->sort('title', 'ASC');  // 按照节点标题升序排列

        $product_ids = $query->execute();
        $products = $this->entityTypeManager->getStorage('node')->loadMultiple($product_ids);

        foreach ($products as $product) {
          $product_data = [
            'id' => (int) $product->id(),
            'name' => $product->getTitle(),
            'title' => $product->getTitle(),
            'url' => $product->toUrl('canonical', ['absolute' => TRUE])->toString(),
          ];

          // 获取价格
          if ($product->hasField('field_p_price') && !$product->get('field_p_price')->isEmpty()) {
            $product_data['price'] = 'HK$' . number_format($product->get('field_p_price')->value, 2);
          } else {
            $product_data['price'] = 'HK$0.00';
          }

          // 获取主图片 - 优先使用maxheight_551样式
          $image_url = null;

          // 首先尝试从变体中获取图片
          if ($product->hasField('field_p_attributes') && !$product->get('field_p_attributes')->isEmpty()) {
            $first_variant = $product->get('field_p_attributes')->first();
            if ($first_variant && $first_variant->entity) {
              $variant = $first_variant->entity;
              if ($variant->hasField('field_v_images') && !$variant->get('field_v_images')->isEmpty()) {
                $variant_image = $variant->get('field_v_images')->first();
                if ($variant_image && $variant_image->entity) {
                  $file_uri = $variant_image->entity->getFileUri();

                  // 尝试生成maxheight_551样式的图片URL
                  try {
                    $image_style = \Drupal::entityTypeManager()->getStorage('image_style')->load('maxheight_551');
                    if ($image_style) {
                      $image_url = $image_style->buildUrl($file_uri);
                    }
                  } catch (\Exception $e) {
                    // 如果样式生成失败，使用原始图片
                    $image_url = \Drupal::service('file_url_generator')->generateAbsoluteString($file_uri);
                  }

                  if (!$image_url) {
                    $image_url = \Drupal::service('file_url_generator')->generateAbsoluteString($file_uri);
                  }
                }
              }
            }
          }

          // 如果变体中没有图片，尝试主图片字段
          if (!$image_url && $product->hasField('field_image') && !$product->get('field_image')->isEmpty()) {
            $main_image = $product->get('field_image')->first();
            if ($main_image && $main_image->entity) {
              $file_uri = $main_image->entity->getFileUri();

              // 尝试生成maxheight_551样式的图片URL
              try {
                $image_style = \Drupal::entityTypeManager()->getStorage('image_style')->load('maxheight_551');
                if ($image_style) {
                  $image_url = $image_style->buildUrl($file_uri);
                }
              } catch (\Exception $e) {
                // 如果样式生成失败，使用原始图片
                $image_url = \Drupal::service('file_url_generator')->generateAbsoluteString($file_uri);
              }

              if (!$image_url) {
                $image_url = \Drupal::service('file_url_generator')->generateAbsoluteString($file_uri);
              }
            }
          }

          // 使用默认图片如果没有找到
          $product_data['image'] = $image_url ?: '/themes/custom/react/images/placeholder.png';

          $recommended_products[] = $product_data;
        }
      }

      $helpers['recommended_products'] = $recommended_products;
    } catch (\Exception $e) {
      // 如果推荐产品查询失败，返回空数组
      $helpers['recommended_products'] = [];
    }

    return $helpers;
  }

  /**
   * 搜索内容
   */
  public function searchContent(Request $request)
  {
    $cache_key = 'react_api:search:' . md5(serialize($request->query->all()));

    // 检查缓存
    if ($cached = $this->cache->get($cache_key)) {
      return $this->successResponse($cached->data);
    }

    $query = $request->query->get('q', '');
    $content_type = $request->query->get('type', '');
    $langcode = $request->query->get('lang', $this->languageManager->getCurrentLanguage()->getId());
    $limit = min((int) $request->query->get('limit', 10), 100);
    $offset = (int) $request->query->get('offset', 0);

    if (empty($query)) {
      return $this->errorResponse('搜索查询不能为空', 400);
    }

    // 设置语言上下文
    $this->setCurrentLanguage($langcode);

    // 创建查询
    $node_query = $this->entityTypeManager->getStorage('node')->getQuery()
      ->condition('status', 1)
      ->accessCheck(TRUE)
      ->range($offset, $limit);

    // 如果指定了内容类型
    if (!empty($content_type)) {
      $node_query->condition('type', $content_type);
    }

    // 应用搜索条件
    $this->applySearchConditions($node_query, $query, $content_type);

    // 按相关性排序（这里简化为按创建时间排序）
    $node_query->sort('created', 'DESC');

    $node_ids = $node_query->execute();

    if (empty($node_ids)) {
      $result = [
        'results' => [],
        'total' => 0,
        'query' => $query,
        'type' => $content_type,
        'language' => $langcode,
      ];

      // 缓存结果
      $this->cache->set($cache_key, $result, time() + 300); // 5分钟缓存
      return $this->successResponse($result);
    }

    // 加载节点
    $nodes = $this->entityTypeManager->getStorage('node')->loadMultiple($node_ids);
    $results = [];

    foreach ($nodes as $node) {
      $results[] = $this->formatNodeData($node, $langcode);
    }

    // 获取总数
    $total_query = $this->entityTypeManager->getStorage('node')->getQuery()
      ->condition('status', 1)
      ->accessCheck(TRUE);

    if (!empty($content_type)) {
      $total_query->condition('type', $content_type);
    }

    $this->applySearchConditions($total_query, $query, $content_type);
    $total = $total_query->count()->execute();

    $result = [
      'results' => $results,
      'total' => (int) $total,
      'query' => $query,
      'type' => $content_type,
      'language' => $langcode,
      'limit' => $limit,
      'offset' => $offset,
    ];

    // 缓存结果
    $this->cache->set($cache_key, $result, time() + 300); // 5分钟缓存

    return $this->successResponse($result);
  }

  /**
   * 获取内容统计信息
   */
  public function getContentStats(Request $request)
  {
    $cache_key = 'react_api:stats:' . $this->languageManager->getCurrentLanguage()->getId();

    // 检查缓存
    if ($cached = $this->cache->get($cache_key)) {
      return $this->successResponse($cached->data);
    }

    $langcode = $request->query->get('lang', $this->languageManager->getCurrentLanguage()->getId());
    $this->setCurrentLanguage($langcode);

    $stats = [];

    // 获取所有内容类型
    $content_types = $this->entityTypeManager->getStorage('node_type')->loadMultiple();

    foreach ($content_types as $content_type) {
      $type_id = $content_type->id();
      $type_label = $content_type->label();

      // 统计已发布的内容
      $published_count = $this->entityTypeManager->getStorage('node')->getQuery()
        ->condition('type', $type_id)
        ->condition('status', 1)
        ->accessCheck(TRUE)
        ->count()
        ->execute();

      // 统计草稿内容
      $draft_count = $this->entityTypeManager->getStorage('node')->getQuery()
        ->condition('type', $type_id)
        ->condition('status', 0)
        ->accessCheck(TRUE)
        ->count()
        ->execute();

      // 统计最近30天的内容
      $recent_count = $this->entityTypeManager->getStorage('node')->getQuery()
        ->condition('type', $type_id)
        ->condition('status', 1)
        ->condition('created', time() - (30 * 24 * 60 * 60), '>')
        ->accessCheck(TRUE)
        ->count()
        ->execute();

      $stats[$type_id] = [
        'label' => $type_label,
        'published' => (int) $published_count,
        'draft' => (int) $draft_count,
        'recent' => (int) $recent_count,
        'total' => (int) ($published_count + $draft_count),
      ];
    }

    // 获取用户统计
    $user_stats = [
      'total_users' => (int) $this->entityTypeManager->getStorage('user')->getQuery()
        ->accessCheck(TRUE)
        ->count()
        ->execute(),
      'active_users' => (int) $this->entityTypeManager->getStorage('user')->getQuery()
        ->condition('status', 1)
        ->accessCheck(TRUE)
        ->count()
        ->execute(),
    ];

    // 获取语言统计
    $language_stats = [];
    $languages = $this->languageManager->getLanguages();

    foreach ($languages as $language) {
      $lang_id = $language->getId();
      $node_count = $this->entityTypeManager->getStorage('node')->getQuery()
        ->condition('langcode', $lang_id)
        ->condition('status', 1)
        ->accessCheck(TRUE)
        ->count()
        ->execute();

      $language_stats[$lang_id] = [
        'name' => $language->getName(),
        'content_count' => (int) $node_count,
      ];
    }

    $result = [
      'content_types' => $stats,
      'users' => $user_stats,
      'languages' => $language_stats,
      'generated_at' => date('c'),
      'language' => $langcode,
    ];

    // 缓存结果30分钟
    $this->cache->set($cache_key, $result, time() + 1800);

    return $this->successResponse($result);
  }

  /**
   * 获取分类术语列表
   *
   * @param Request $request
   * @param string $vocabulary_id 词汇表ID，如 'recipe_category', 'tags'
   * @return JsonResponse
   */
  public function getTaxonomyTerms(Request $request, $vocabulary_id)
  {
    $language = $request->query->get('lang');
    $limit = $request->query->get('limit', 50);
    $offset = $request->query->get('offset', 0);
    $sort = $request->query->get('sort', 'name');
    $order = $request->query->get('order', 'ASC');

    try {
      // 设置当前语言
      if ($language) {
        $this->setCurrentLanguage($language);
      }

      // 验证词汇表是否存在
      $vocabulary = $this->entityTypeManager->getStorage('taxonomy_vocabulary')->load($vocabulary_id);
      if (!$vocabulary) {
        return $this->errorResponse("Vocabulary '$vocabulary_id' not found", 404);
      }

      // 构建查询
      $query = $this->entityTypeManager->getStorage('taxonomy_term')->getQuery()
        ->condition('vid', $vocabulary_id)
        ->accessCheck(TRUE)
        ->range($offset, $limit)
        ->sort($sort, $order);

      $term_ids = $query->execute();
      $terms = $this->entityTypeManager->getStorage('taxonomy_term')->loadMultiple($term_ids);

      $formatted_terms = [];
      foreach ($terms as $term) {
        $formatted_terms[] = $this->formatTaxonomyTermData($term, $language);
      }

      // 获取总数（用于分页）
      $total_query = $this->entityTypeManager->getStorage('taxonomy_term')->getQuery()
        ->condition('vid', $vocabulary_id)
        ->accessCheck(TRUE);
      $total = $total_query->count()->execute();

      return $this->successResponse([
        'vocabulary' => $vocabulary_id,
        'vocabulary_label' => $vocabulary->label(),
        'items' => $formatted_terms,
        'pagination' => [
          'total' => (int) $total,
          'limit' => (int) $limit,
          'offset' => (int) $offset,
          'has_next' => ($offset + $limit) < $total,
          'has_previous' => $offset > 0,
        ],
      ]);
    } catch (\Exception $e) {
      return $this->errorResponse($e->getMessage(), 500);
    }
  }

  /**
   * 格式化分类术语数据
   *
   * @param \Drupal\taxonomy\TermInterface $term
   * @param string|null $target_language
   * @return array
   */
  private function formatTaxonomyTermData($term, $target_language = NULL)
  {
    $current_language = $this->languageManager->getCurrentLanguage()->getId();

    // 如果指定了目标语言且术语有该翻译，使用翻译版本
    if ($target_language && $term->hasTranslation($target_language)) {
      $term = $term->getTranslation($target_language);
      $current_language = $target_language;
    } elseif ($term->hasTranslation($current_language)) {
      $term = $term->getTranslation($current_language);
    }

    $data = [
      'id' => (int) $term->id(),
      'uuid' => $term->uuid(),
      'name' => $term->getName(),
      'description' => '',
      'vocabulary' => $term->bundle(),
      'language' => $term->language()->getId(),
      'weight' => (int) $term->getWeight(),
      'parent' => [],
    ];

    // 处理描述字段
    if ($term->hasField('description') && !$term->get('description')->isEmpty()) {
      $description = $term->get('description')->first();
      $data['description'] = [
        'value' => $description->value,
        'processed' => $description->processed,
        'format' => $description->format,
      ];
    }

    // 处理自定义字段
    $custom_fields = [];
    $field_definitions = $term->getFieldDefinitions();

    foreach ($field_definitions as $field_name => $field_definition) {
      // 只处理自定义字段（以 field_ 开头）
      if (strpos($field_name, 'field_') === 0 && !$term->get($field_name)->isEmpty()) {
        $custom_fields[$field_name] = $this->formatFieldValue($term->get($field_name));
      }
    }

    if (!empty($custom_fields)) {
      $data['fields'] = $custom_fields;
    }

    // 获取父级术语
    $parent_ids = $this->entityTypeManager->getStorage('taxonomy_term')->loadParents($term->id());
    if (!empty($parent_ids)) {
      $parents = [];
      foreach ($parent_ids as $parent_term) {
        $parents[] = [
          'id' => (int) $parent_term->id(),
          'name' => $parent_term->getName(),
          'uuid' => $parent_term->uuid(),
        ];
      }
      $data['parent'] = $parents;
    }

    // 添加翻译信息
    $translations = [];
    foreach ($term->getTranslationLanguages() as $langcode => $language) {
      $translated_term = $term->getTranslation($langcode);
      $translations[] = [
        'langcode' => $langcode,
        'name' => $language->getName(),
        'term_name' => $translated_term->getName(),
      ];
    }
    $data['translations'] = $translations;

    return $data;
  }
}
