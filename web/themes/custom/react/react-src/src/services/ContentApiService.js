/**
 * 统一内容 API 服务
 * 整合了 Drupal JSON API 和自定义 API 功能
 * 支持多语言（中文、英文、西班牙语）和缓存机制
 */
class ContentApiService {
  constructor() {
    this.baseUrl = window.location.origin;
    this.jsonApiBase = `${this.baseUrl}/jsonapi`;
    this.customApiBase = `${this.baseUrl}/api`;
    this.cache = new Map();
    this.cacheTimeout = 1 * 60 * 1000; // 1分钟缓存
    this.defaultLanguage = 'en'; // 默认语言改为英语
    this.currentLanguage = this.getCurrentLanguage();

    // 支持的语言配置
    this.supportedLanguages = {
      'zh-hans': {
        code: 'zh-hans',
        name: '简体中文',
        nativeName: '简体中文',
        direction: 'ltr',
        jsonApiFilter: 'zh-hans',
        drupalLangcode: 'zh-hans'
      },
      'en': {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        direction: 'ltr',
        jsonApiFilter: 'en',
        drupalLangcode: 'en'
      },
      'es': {
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        direction: 'ltr',
        jsonApiFilter: 'es',
        drupalLangcode: 'es'
      }
    };
  }

  /**
   * 获取当前语言
   */
  getCurrentLanguage() {
    // 优先级：URL参数 > URL路径 > localStorage > 浏览器语言 > 默认语言
    const urlParams = new URLSearchParams(window.location.search);
    const langFromUrl = urlParams.get('lang');
    if (langFromUrl && this.supportedLanguages[langFromUrl]) {
      return langFromUrl;
    }

    // 从URL路径检测语言 - 与Drupal URL别名保持一致
    const path = window.location.pathname;
    if (path.startsWith('/zh-hans')) {
      return 'zh-hans';
    }
    if (path.startsWith('/es')) {
      return 'es';
    }
    // 根路径或其他路径默认为英语
    if (path === '/' || !path.startsWith('/zh-hans') && !path.startsWith('/es')) {
      return 'en';
    }

    const langFromStorage = localStorage.getItem('drupal_language');
    if (langFromStorage && this.supportedLanguages[langFromStorage]) {
      return langFromStorage;
    }

    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('zh')) {
      return 'zh-hans';
    }
    if (browserLang.startsWith('en')) {
      return 'en';
    }
    if (browserLang.startsWith('es')) {
      return 'es';
    }

    return this.defaultLanguage;
  }

  /**
   * 设置当前语言
   */
  setCurrentLanguage(language) {
    if (!this.supportedLanguages[language]) {
      console.warn(`Unsupported language: ${language}`);
      return;
    }

    this.currentLanguage = language;
    localStorage.setItem('drupal_language', language);

    // 触发语言变更事件
    window.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { language, languageInfo: this.supportedLanguages[language] }
    }));
  }

  /**
   * 获取语言信息
   */
  getLanguageInfo(langCode = null) {
    const lang = langCode || this.currentLanguage;
    return this.supportedLanguages[lang] || this.supportedLanguages[this.defaultLanguage];
  }

  /**
   * 获取所有支持的语言
   */
  getSupportedLanguages() {
    return Object.values(this.supportedLanguages);
  }

  /**
   * 构建 JSON API URL
   */
  buildJsonApiUrl(endpoint, params = {}) {
    const url = new URL(`${this.jsonApiBase}/${endpoint}`);

    // 添加语言过滤器
    const langInfo = this.getLanguageInfo();
    if (langInfo.code !== 'en') {
      params['filter[langcode]'] = langInfo.jsonApiFilter;
    }

    // 添加其他参数
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, value);
      }
    });

    return url.toString();
  }

  /**
   * 构建自定义 API URL
   */
  buildCustomApiUrl(endpoint, params = {}) {
    const url = new URL(`${this.customApiBase}/${endpoint}`);

    // 添加语言参数
    const langInfo = this.getLanguageInfo();
    if (langInfo.code !== this.defaultLanguage) {
      params.lang = langInfo.code;
    }

    // 添加其他参数
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        url.searchParams.append(key, params[key]);
      }
    });

    return url.toString();
  }

  /**
   * 通用的 fetch 方法
   */
  async makeRequest(url, options = {}) {
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
    };

    const requestOptions = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        // 如果是404错误且URL包含语言参数，尝试语言回退
        if (response.status === 404 && url.includes('lang=') && !url.includes('lang=en')) {
          console.warn(`Content not found for current language, trying fallback to English: ${url}`);

          // 构建英语回退URL
          const fallbackUrl = url.replace(/lang=[^&]+/, 'lang=en');

          try {
            const fallbackResponse = await fetch(fallbackUrl, requestOptions);

            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();

              // 处理自定义 API 响应格式
              if (fallbackData.hasOwnProperty('success')) {
                if (!fallbackData.success) {
                  throw new Error(fallbackData.error?.message || 'API request failed');
                }
                return fallbackData.data;
              }

              // 处理 JSON API 响应格式
              return fallbackData;
            }
          } catch (fallbackError) {
            console.warn('Fallback request also failed:', fallbackError);
          }
        }

        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // 处理自定义 API 响应格式
      if (data.hasOwnProperty('success')) {
        if (!data.success) {
          throw new Error(data.error?.message || 'API request failed');
        }
        return data.data;
      }

      // 处理 JSON API 响应格式
      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  /**
   * 缓存处理
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clearCache(pattern = null) {
    if (pattern) {
      // 清除匹配模式的缓存
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      // 清除所有缓存
      this.cache.clear();
    }
  }

  // ========== JSON API 方法 ==========

  /**
   * 获取食谱列表 (使用自定义 API)
   */
  async getRecipes(params = {}) {
    console.log('[ContentApiService] getRecipes called with params:', params);

    // 处理分页参数
    const page = params.page || 0; // API使用0开始的页码
    const limit = params.limit || 10;

    // 构建查询参数
    const queryParams = {
      page,
      limit,
      sort: params.sort || 'created',
      order: params.order || 'DESC',
      status: 1,
      include: 'field_recipe_image,field_recipe_category'
    };

    // 处理搜索过滤器
    if (params['filter[title][operator]'] && params['filter[title][value]']) {
      queryParams['filter[title][operator]'] = params['filter[title][operator]'];
      queryParams['filter[title][value]'] = params['filter[title][value]'];
    }

    // 处理分类过滤器
    if (params['filter[field_recipe_category.target_id]']) {
      queryParams['filter[field_recipe_category.target_id]'] = params['filter[field_recipe_category.target_id]'];
    }

    // 处理难度过滤器
    if (params['filter[field_difficulty]']) {
      queryParams['filter[field_difficulty]'] = params['filter[field_difficulty]'];
    }

    // 添加其他自定义参数
    Object.keys(params).forEach(key => {
      if (!queryParams.hasOwnProperty(key) && key.startsWith('filter[')) {
        queryParams[key] = params[key];
      }
    });

    console.log('[ContentApiService] Final query params:', queryParams);

    const cacheKey = `recipes_${JSON.stringify(queryParams)}_${this.currentLanguage}`;

    // 检查缓存
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      console.log('[ContentApiService] Returning cached data for:', cacheKey);
      return cached;
    }

    try {
      const url = this.buildCustomApiUrl('content/recipe', queryParams);
      console.log('[ContentApiService] Making request to:', url);

      const data = await this.makeRequest(url);
      console.log('[ContentApiService] API response:', data);

      // 处理响应数据结构
      let processedData = data;

      // 如果API返回标准格式，确保有正确的结构
      if (data && !data.hasOwnProperty('items') && !data.hasOwnProperty('data')) {
        // 如果直接返回数组，包装成标准格式
        if (Array.isArray(data)) {
          processedData = {
            items: data,
            pagination: {
              page,
              limit,
              total: data.length,
              totalPages: Math.ceil(data.length / limit)
            }
          };
        }
      }

      // 缓存数据
      this.setCachedData(cacheKey, processedData);
      return processedData;
    } catch (error) {
      console.error('[ContentApiService] Error fetching recipes:', error);
      throw error;
    }
  }

  /**
   * 获取特定食谱 (使用自定义 API)
   */
  async getRecipe(id, useCache = true) {
    const cacheKey = `recipe_${id}_${this.currentLanguage}`;

    if (useCache) {
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;
    }

    const params = {
      include: 'field_recipe_image,field_recipe_category,field_recipe_ingredients,field_recipe_instructions',
    };

    const url = this.buildCustomApiUrl(`content/recipe/${id}`, params);
    const data = await this.makeRequest(url);

    if (useCache) {
      this.setCachedData(cacheKey, data);
    }

    return data;
  }

  /**
   * 通过 URL 别名获取食谱
   */
  async getRecipeByUrlAlias(urlAlias, useCache = true) {
    const cacheKey = `recipe_url_alias_${urlAlias}_${this.currentLanguage}`;

    if (useCache) {
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;
    }

    try {
      console.log(`[DEBUG] Looking for recipe with URL alias: "${urlAlias}"`);
      console.log(`[DEBUG] Current language: "${this.currentLanguage}"`);

      // 获取食谱列表
      const recipeListResponse = await this.getRecipes({ limit: 50 });

      // 修正：检查实际的API响应结构
      if (recipeListResponse && recipeListResponse.items && Array.isArray(recipeListResponse.items)) {
        console.log(`[DEBUG] Got ${recipeListResponse.items.length} recipes from API`);

        // 查找匹配的食谱
        const targetRecipe = recipeListResponse.items.find(recipe => {
          console.log(`[DEBUG] Checking recipe: "${recipe.title}" (ID: ${recipe.id})`);

          // 优先检查urls字段中的多语言URL
          if (recipe.urls && typeof recipe.urls === 'object') {
            console.log(`[DEBUG]   Available URLs:`, recipe.urls);

            // 检查当前语言的URL
            const currentLangUrl = recipe.urls[this.currentLanguage];
            if (currentLangUrl && currentLangUrl.canonical) {
              const urlPath = new URL(currentLangUrl.canonical).pathname;
              const pathSegments = urlPath.split('/');
              const lastSegment = pathSegments[pathSegments.length - 1];

              console.log(`[DEBUG]   Current language (${this.currentLanguage}) URL: ${currentLangUrl.canonical}`);
              console.log(`[DEBUG]   Last segment: ${lastSegment}, Target: ${urlAlias}`);

              if (lastSegment === urlAlias) {
                console.log(`[DEBUG]   ✓ Match found for ${this.currentLanguage}: ${lastSegment} === ${urlAlias}`);
                return true;
              }
            }

            // 如果当前语言没有匹配，检查所有语言的URL
            for (const [lang, urlData] of Object.entries(recipe.urls)) {
              if (urlData && urlData.canonical) {
                const urlPath = new URL(urlData.canonical).pathname;
                const pathSegments = urlPath.split('/');
                const lastSegment = pathSegments[pathSegments.length - 1];

                console.log(`[DEBUG]   Checking ${lang} URL: ${urlData.canonical}, last segment: ${lastSegment}`);

                if (lastSegment === urlAlias) {
                  console.log(`[DEBUG]   ✓ Match found for ${lang}: ${lastSegment} === ${urlAlias}`);
                  return true;
                }
              }
            }
          }

          // 回退到检查单一URL字段
          if (recipe.url) {
            const urlPath = new URL(recipe.url).pathname;
            const pathSegments = urlPath.split('/');
            const lastSegment = pathSegments[pathSegments.length - 1];

            console.log(`[DEBUG]   Fallback URL check: ${recipe.url}, last segment: ${lastSegment}`);

            if (lastSegment === urlAlias) {
              console.log(`[DEBUG]   ✓ Fallback match found: ${lastSegment} === ${urlAlias}`);
              return true;
            }
          }

          console.log(`[DEBUG]   ✗ No match found for recipe "${recipe.title}"`);
          return false;
        });

        console.log(`[DEBUG] Target recipe found:`, targetRecipe ? `"${targetRecipe.title}" (ID: ${targetRecipe.id})` : 'null');

        if (targetRecipe) {
          // 找到了匹配的食谱，使用其ID获取详细信息
          const recipeData = await this.getRecipe(targetRecipe.id, useCache);

          if (useCache) {
            this.setCachedData(cacheKey, recipeData);
          }

          return recipeData;
        }
      } else {
        console.log('[DEBUG] Invalid API response structure:', recipeListResponse);
      }

      // 如果没有找到，抛出404错误
      throw new Error(`Recipe with URL alias "${urlAlias}" not found`);
    } catch (error) {
      console.error(`Failed to get recipe by URL alias: ${urlAlias}`, error);
      throw error;
    }
  }

  /**
   * 获取文章列表
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 文章列表数据
   */
  async getArticles(options = {}) {
    const {
      page = 1,
      limit = 12,
      category = null,
      tags = null,
      sort = 'created',
      order = 'DESC'
    } = options;

    // 参数验证和修正
    const validPage = Math.max(1, parseInt(page) || 1);
    const validLimit = Math.max(1, parseInt(limit) || 12);

    console.log('[ContentApiService] getArticles called with:', {
      originalPage: page,
      validPage,
      limit: validLimit,
      category,
      tags,
      sort,
      order
    });

    const cacheKey = `articles_${JSON.stringify({...options, page: validPage, limit: validLimit})}_${this.currentLanguage}`;

    // 检查缓存
    if (this.cache.has(cacheKey)) {
      console.log('[ContentApiService] Returning cached articles data');
      return this.cache.get(cacheKey);
    }

    try {
      // 计算正确的offset值 - 使用validPage确保不会是负数
      const offset = Math.max(0, (validPage - 1) * validLimit);

      const params = {
        limit: validLimit,
        sort: order === 'DESC' ? `-${sort}` : sort,
        offset: offset
      };

      // 添加过滤条件
      if (category) params['filter[field_article_category.target_id]'] = category;
      if (tags) params['filter[field_tags.target_id]'] = tags;

      const url = this.buildCustomApiUrl('content/article', params);
      console.log('[ContentApiService] Fetching articles from:', url);
      console.log('[ContentApiService] Final API params:', params);

      const data = await this.makeRequest(url);
      console.log('[ContentApiService] Articles API response:', data);

      // 处理不同的响应格式
      let result;
      if (data && data.items) {
        result = {
          success: true,
          data: data.items,
          pagination: {
            currentPage: validPage,
            totalItems: data.pagination?.total || data.items.length,
            totalPages: data.pagination?.totalPages || Math.ceil((data.pagination?.total || data.items.length) / validLimit),
            itemsPerPage: validLimit,
            ...data.pagination
          }
        };
      } else if (Array.isArray(data)) {
        result = {
          success: true,
          data: data,
          pagination: {
            currentPage: validPage,
            totalItems: data.length,
            totalPages: Math.ceil(data.length / validLimit),
            itemsPerPage: validLimit
          }
        };
      } else {
        result = {
          success: true,
          data: [],
          pagination: {
            currentPage: 1,
            totalItems: 0,
            totalPages: 0,
            itemsPerPage: validLimit
          }
        };
      }

      console.log('[ContentApiService] Processed articles result:', result);

      // 缓存结果
      this.cache.set(cacheKey, result);
      return result;

    } catch (error) {
      console.error('[ContentApiService] 获取文章列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取特定文章 (使用自定义 API)
   */
  async getArticle(id, useCache = true) {
    const cacheKey = `article_${id}_${this.currentLanguage}`;

    if (useCache) {
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;
    }

    try {
      const url = this.buildCustomApiUrl(`content/article/${id}`);
      console.log('Fetching article from:', url);

      const data = await this.makeRequest(url);
      console.log('Article API response:', data);

      if (useCache) {
        this.setCachedData(cacheKey, data);
      }

      return data;

    } catch (error) {
      console.error(`获取文章失败 (ID: ${id}):`, error);
      throw error;
    }
  }

  /**
   * 通过URL别名获取文章
   * @param {string} urlAlias URL别名
   * @returns {Promise<Object>} 文章数据
   */
  async getArticleByUrlAlias(urlAlias) {
    const cacheKey = `article_alias_${urlAlias}_${this.currentLanguage}`;

    // 检查缓存
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // 获取所有文章并查找匹配的URL
      const articlesResponse = await this.getArticles({ limit: 100 });
      const articles = articlesResponse.data || articlesResponse.items || [];

      console.log(`搜索文章URL别名: ${urlAlias}, 当前语言: ${this.currentLanguage}`);

      for (const article of articles) {
        // 调试日志
        console.log(`检查文章: ${article.title}, ID: ${article.id}`);
        console.log('文章URLs:', article.urls);
        console.log('文章URL:', article.url);

        // 1. 优先检查 urls 对象中的当前语言URL
        if (article.urls && typeof article.urls === 'object') {
          const currentLangUrl = article.urls[this.currentLanguage];
          if (currentLangUrl && currentLangUrl.canonical) {
            const currentUrlPath = new URL(currentLangUrl.canonical).pathname;
            const currentLastSegment = currentUrlPath.split('/').pop();
            console.log(`当前语言(${this.currentLanguage})URL最后段: ${currentLastSegment} vs ${urlAlias}`);

            if (currentLastSegment === urlAlias) {
              console.log('✓ 当前语言URL匹配成功');
              this.cache.set(cacheKey, article);
              return article;
            }
          }

          // 2. 如果当前语言没有匹配，检查所有语言的URL
          for (const [lang, langUrlData] of Object.entries(article.urls)) {
            if (langUrlData && langUrlData.canonical) {
              try {
                const urlPath = new URL(langUrlData.canonical).pathname;
                const lastSegment = urlPath.split('/').pop();
                console.log(`语言(${lang})URL最后段: ${lastSegment} vs ${urlAlias}`);

                if (lastSegment === urlAlias) {
                  console.log(`✓ 语言(${lang})URL匹配成功`);
                  this.cache.set(cacheKey, article);
                  return article;
                }
              } catch (urlError) {
                console.warn(`解析URL失败 (${lang}):`, langUrlData.canonical, urlError);
              }
            }
          }
        }

        // 3. 最后检查主URL字段
        if (article.url) {
          try {
            const urlPath = new URL(article.url).pathname;
            const lastSegment = urlPath.split('/').pop();
            console.log(`主URL最后段: ${lastSegment} vs ${urlAlias}`);

            if (lastSegment === urlAlias) {
              console.log('✓ 主URL匹配成功');
              this.cache.set(cacheKey, article);
              return article;
            }
          } catch (urlError) {
            console.warn('解析主URL失败:', article.url, urlError);
          }
        }
      }

      throw new Error(`未找到URL别名为 "${urlAlias}" 的文章`);
    } catch (error) {
      console.error('通过URL别名获取文章失败:', error);
      throw error;
    }
  }

  /**
   * 获取食谱分类 (使用自定义 API)
   */
  async getRecipeCategories(params = {}) {
    console.log('[ContentApiService] getRecipeCategories called with params:', params);

    const defaultParams = {
      sort: 'name',
      limit: params.limit || 50,
    };

    const mergedParams = { ...defaultParams, ...params };
    const cacheKey = `recipe_categories_${JSON.stringify(mergedParams)}_${this.currentLanguage}`;

    // 检查缓存
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      console.log('[ContentApiService] Returning cached categories data');
      return cached;
    }

    try {
      const url = this.buildCustomApiUrl('taxonomy/recipe_category', mergedParams);
      console.log('[ContentApiService] Making categories request to:', url);

      const data = await this.makeRequest(url);
      console.log('[ContentApiService] Categories API response:', data);

      // 处理响应数据结构
      let processedData = data;

      // 如果API返回标准格式，确保有正确的结构
      if (data && !data.hasOwnProperty('items') && !data.hasOwnProperty('data')) {
        // 如果直接返回数组，包装成标准格式
        if (Array.isArray(data)) {
          processedData = {
            items: data,
            total: data.length
          };
        }
      }

      // 缓存数据
      this.setCachedData(cacheKey, processedData);
      return processedData;
    } catch (error) {
      console.error('[ContentApiService] Error fetching recipe categories:', error);

      // 返回空结果而不是抛出错误，让页面继续工作
      const emptyResult = {
        items: [],
        total: 0
      };

      this.setCachedData(cacheKey, emptyResult);
      return emptyResult;
    }
  }

  /**
   * 获取特色内容（首页推荐）
   */
  async getFeaturedContent() {
    const cacheKey = `featured_content_${this.currentLanguage}`;

    // 检查缓存
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // 并行获取特色食谱和文章
      const [recipes, articles] = await Promise.all([
        this.getRecipes({
          'filter[promote]': 1,
          'page[limit]': 6
        }),
        this.getArticles({
          'filter[promote]': 1,
          'page[limit]': 3
        })
      ]);

      const result = {
        recipes: recipes.data || [],
        articles: articles.data || [],
        included: [...(recipes.included || []), ...(articles.included || [])]
      };

      // 缓存数据
      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error('获取特色内容失败:', error);
      return {
        recipes: [],
        articles: [],
        included: []
      };
    }
  }

  /**
   * 搜索内容 (使用自定义 API)
   */
  async searchContent(query, contentType = null) {
    const params = {
      q: query,
      limit: 20,
    };

    if (contentType) {
      params.type = contentType;
    }

    try {
      const url = this.buildCustomApiUrl('search', params);
      const results = await this.makeRequest(url);
      return results || [];
    } catch (error) {
      console.error('搜索失败:', error);
      return [];
    }
  }

  // ========== 自定义 API 方法 ==========

  /**
   * 通过页面路径获取内容
   */
  async getPageContent(pagePath, language = null, useCache = true) {
    const lang = language || this.currentLanguage;
    const cacheKey = `page_${pagePath}_${lang}`;

    // 检查缓存
    if (useCache) {
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const url = this.buildCustomApiUrl(`page/${pagePath}`, { lang });
    const data = await this.makeRequest(url);

    // 缓存数据
    if (useCache) {
      this.setCachedData(cacheKey, data);
    }

    return data;
  }

  /**
   * 通过内容类型获取内容列表
   */
  async getContentByType(contentType, options = {}) {
    const {
      language = null,
      limit = 20,
      offset = 0,
      sort = 'created',
      order = 'DESC',
      filters = {},
      useCache = true,
    } = options;

    const lang = language || this.currentLanguage;
    const cacheKey = `content_${contentType}_${JSON.stringify({ lang, limit, offset, sort, order, filters })}`;

    // 检查缓存
    if (useCache) {
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const params = {
      lang,
      limit,
      offset,
      sort,
      order,
      ...filters,
    };

    const url = this.buildCustomApiUrl(`content/${contentType}`, params);
    const data = await this.makeRequest(url);

    // 缓存数据
    if (useCache) {
      this.setCachedData(cacheKey, data);
    }

    return data;
  }

  /**
   * 获取单个内容项
   */
  async getSingleContent(contentType, nodeId, language = null, useCache = true) {
    const lang = language || this.currentLanguage;
    const cacheKey = `single_${contentType}_${nodeId}_${lang}`;

    // 检查缓存
    if (useCache) {
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const url = this.buildCustomApiUrl(`content/${contentType}/${nodeId}`, { lang });
    const data = await this.makeRequest(url);

    // 缓存数据
    if (useCache) {
      this.setCachedData(cacheKey, data);
    }

    return data;
  }

  /**
   * 获取可用的语言列表
   */
  async getAvailableLanguages(useCache = true) {
    const cacheKey = 'available_languages';

    // 检查缓存
    if (useCache) {
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const url = this.buildCustomApiUrl('languages');
      const data = await this.makeRequest(url);

      // 缓存数据（语言列表缓存时间更长）
      if (useCache) {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
        });
      }

      return data;
    } catch (error) {
      // 如果API失败，返回本地配置的语言
      console.warn('Failed to fetch languages from API, using local config:', error);
      return this.getSupportedLanguages();
    }
  }

  /**
   * 获取单个产品内容
   */
  async getProductContent(nodeId, language = null, useCache = true) {
    const lang = language || this.currentLanguage;
    const cacheKey = `product_${nodeId}_${lang}`;

    // 检查缓存
    if (useCache) {
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const url = this.buildCustomApiUrl(`content/products/${nodeId}`, { lang });
    const data = await this.makeRequest(url);

    // 缓存数据
    if (useCache) {
      this.setCachedData(cacheKey, data);
    }

    return data;
  }

  /**
   * 获取所有产品列表
   */
  async getProductsList(options = {}) {
    const {
      language = null,
      limit = 20,
      offset = 0,
      sort = 'created',
      order = 'DESC',
      filters = {},
      useCache = true,
    } = options;

    const lang = language || this.currentLanguage;
    const cacheKey = `products_list_${JSON.stringify({ lang, limit, offset, sort, order, filters })}`;

    // 检查缓存
    if (useCache) {
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const url = this.buildCustomApiUrl('content/products', {
      lang,
      limit,
      offset,
      sort,
      order,
      ...filters
    });

    const data = await this.makeRequest(url);

    // 缓存数据
    if (useCache) {
      this.setCachedData(cacheKey, data);
    }

    return data;
  }

  // ========== 数据格式化工具方法 ==========

  /**
   * 解析图片 URL
   */
  getImageUrl(imageData, included = []) {
    if (!imageData || !imageData.data) return null;

    const imageId = imageData.data.id;
    const imageEntity = included.find(item => item.id === imageId);

    if (imageEntity && imageEntity.attributes && imageEntity.attributes.uri) {
      const uri = imageEntity.attributes.uri.url;
      return uri.startsWith('http') ? uri : `${this.baseUrl}${uri}`;
    }

    return null;
  }

  /**
   * 解析分类名称
   */
  getCategoryName(categoryData, included = []) {
    if (!categoryData || !categoryData.data) return null;

    const categoryId = categoryData.data.id;
    const categoryEntity = included.find(item => item.id === categoryId);

    if (categoryEntity && categoryEntity.attributes && categoryEntity.attributes.name) {
      return categoryEntity.attributes.name;
    }

    return null;
  }

  /**
   * 格式化食谱数据
   */
  formatRecipeData(recipeData, included = []) {
    if (!recipeData || !recipeData.attributes) return null;

    const attrs = recipeData.attributes;

    return {
      id: recipeData.id,
      title: attrs.title,
      body: attrs.body?.processed || attrs.body?.value || '',
      summary: attrs.field_recipe_summary || '',
      prepTime: attrs.field_prep_time || 0,
      cookTime: attrs.field_cook_time || 0,
      servings: attrs.field_servings || 1,
      difficulty: attrs.field_difficulty || 'Easy',
      image: this.getImageUrl(attrs.field_recipe_image, included),
      category: this.getCategoryName(attrs.field_recipe_category, included),
      ingredients: attrs.field_recipe_ingredients || [],
      instructions: attrs.field_recipe_instructions || [],
      created: attrs.created,
      changed: attrs.changed,
      language: attrs.langcode,
    };
  }

  /**
   * 格式化文章数据
   */
  formatArticleData(articleData, included = []) {
    if (!articleData || !articleData.attributes) return null;

    const attrs = articleData.attributes;

    return {
      id: articleData.id,
      title: attrs.title,
      body: attrs.body?.processed || attrs.body?.value || '',
      summary: attrs.field_summary || '',
      image: this.getImageUrl(attrs.field_image, included),
      created: attrs.created,
      changed: attrs.changed,
      language: attrs.langcode,
    };
  }

  // ========== 高级功能 ==========

  /**
   * 监听内容变化
   */
  watchContent(type, identifier, callback, interval = 30000) {
    let lastUpdateTime = 0;

    const checkUpdates = async () => {
      try {
        let data;
        if (type === 'page') {
          data = await this.getPageContent(identifier, null, false);
        } else if (type === 'content') {
          const result = await this.getContentByType(identifier, { useCache: false, limit: 1 });
          data = result.items[0];
        }

        if (data && data.updated > lastUpdateTime) {
          lastUpdateTime = data.updated;
          callback(data);
        }
      } catch (error) {
        console.warn('Failed to check for content updates:', error);
      }
    };

    // 初始检查
    checkUpdates();

    // 定期检查
    const intervalId = setInterval(checkUpdates, interval);

    return () => clearInterval(intervalId);
  }

  /**
   * 预加载内容
   */
  async preloadContent(preloadList) {
    const promises = preloadList.map(async (item) => {
      try {
        if (item.type === 'page') {
          await this.getPageContent(item.identifier, item.language);
        } else if (item.type === 'content') {
          await this.getContentByType(item.identifier, {
            language: item.language,
            limit: item.limit || 20,
          });
        } else if (item.type === 'recipe') {
          await this.getRecipe(item.identifier);
        } else if (item.type === 'article') {
          await this.getArticle(item.identifier);
        }
      } catch (error) {
        console.warn(`Failed to preload ${item.type}:${item.identifier}`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * 批量获取内容
   */
  async batchGetContent(requests) {
    const promises = requests.map(async (request) => {
      try {
        const { type, ...params } = request;

        switch (type) {
          case 'recipe':
            return await this.getRecipe(params.id);
          case 'article':
            return await this.getArticle(params.id);
          case 'recipes':
            return await this.getRecipes(params);
          case 'articles':
            return await this.getArticles(params);
          case 'page':
            return await this.getPageContent(params.path, params.language);
          case 'content':
            return await this.getContentByType(params.contentType, params.options);
          default:
            throw new Error(`Unknown request type: ${type}`);
        }
      } catch (error) {
        console.warn(`Batch request failed for ${request.type}:`, error);
        return null;
      }
    });

    return await Promise.allSettled(promises);
  }

  /**
   * 获取内容统计信息 (使用自定义 API)
   */
  async getContentStats() {
    const cacheKey = `content_stats_${this.currentLanguage}`;

    // 检查缓存
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const url = this.buildCustomApiUrl('stats');
      const stats = await this.makeRequest(url);

      // 缓存统计数据
      this.setCachedData(cacheKey, stats);
      return stats;
    } catch (error) {
      console.error('Failed to get content stats:', error);
      return {
        totalRecipes: 0,
        totalArticles: 0,
        totalCategories: 0,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  /**
   * 根据分类获取食谱
   * @param {number} categoryId - 分类ID
   * @param {number} excludeRecipeId - 要排除的食谱ID
   * @param {number} limit - 限制数量
   */
  async getRecipesByCategory(categoryId, excludeRecipeId = null, limit = 4) {
    try {
      console.log(`[ContentApiService] Fetching recipes by category ${categoryId}, excluding recipe ${excludeRecipeId}`);

      const cacheKey = `recipes_category_${categoryId}_exclude_${excludeRecipeId}_limit_${limit}_lang_${this.currentLanguage}`;

      // 检查缓存
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        console.log(`[ContentApiService] Returning cached recipes by category`);
        return cached;
      }

      // 构建查询参数
      const params = {
        limit: limit.toString(),
        'filter[field_recipe_category.target_id]': categoryId
      };

      // 排除指定的食谱
      if (excludeRecipeId) {
        params['filter[id][condition][operator]'] = '!=';
        params['filter[id][condition][value]'] = excludeRecipeId;
      }

      const url = this.buildCustomApiUrl('content/recipe', params);
      console.log(`[ContentApiService] API URL for category recipes: ${url}`);

      const data = await this.makeRequest(url);
      console.log(`[ContentApiService] Category recipes response:`, data);

      let result;

      // 处理不同的响应格式
      if (data && data.items) {
        result = data.items;
      } else if (Array.isArray(data)) {
        result = data;
      } else {
        console.warn('[ContentApiService] Unexpected response format for category recipes:', data);
        result = [];
      }

      // 缓存结果
      this.setCachedData(cacheKey, result);

      console.log(`[ContentApiService] Returning ${result.length} recipes for category ${categoryId}`);
      return result;

    } catch (error) {
      console.error('[ContentApiService] Error fetching recipes by category:', error);
      throw new Error(`Failed to fetch recipes by category: ${error.message}`);
    }
  }

  // ==========================================
  // 文章相关方法
  // ==========================================

  /**
   * 获取文章分类
   * @param {Object} options 查询选项
   * @returns {Promise<Object>} 分类数据
   */
  async getArticleCategories(options = {}) {
    const { limit = 20 } = options;
    const cacheKey = `article_categories_${limit}_${this.currentLanguage}`;

    // 检查缓存
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const params = { limit };
      const url = this.buildCustomApiUrl('taxonomy/article_category', params);
      console.log('Fetching article categories from:', url);

      const data = await this.makeRequest(url);
      console.log('Article categories API response:', data);

      // 处理响应格式
      let result;
      if (data && data.items) {
        result = {
          success: true,
          data: data.items
        };
      } else if (Array.isArray(data)) {
        result = {
          success: true,
          data: data
        };
      } else {
        result = {
          success: true,
          data: []
        };
      }

      // 缓存结果
      this.cache.set(cacheKey, result);
      return result;

    } catch (error) {
      console.error('获取文章分类失败:', error);
      // 返回空结果而不是抛出错误
      return {
        success: true,
        data: []
      };
    }
  }

  /**
   * 根据分类获取相关文章
   * @param {string} categoryId 分类ID
   * @param {string} excludeArticleId 要排除的文章ID
   * @param {number} limit 限制数量
   * @returns {Promise<Array>} 相关文章列表
   */
  async getArticlesByCategory(categoryId, excludeArticleId = null, limit = 4) {
    const cacheKey = `articles_by_category_${categoryId}_${excludeArticleId}_${limit}_${this.currentLanguage}`;

    // 检查缓存
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const params = {
        limit: limit + (excludeArticleId ? 1 : 0), // 如果需要排除，多获取一个
        sort: '-created'
      };

      // 添加分类过滤
      if (categoryId) {
        params['filter[field_article_category.target_id]'] = categoryId;
      }

      const url = this.buildCustomApiUrl('content/article', params);
      console.log('Fetching articles by category from:', url);

      const data = await this.makeRequest(url);
      console.log('Articles by category API response:', data);

      let articles = [];

      // 处理不同的响应格式
      if (data && data.items) {
        articles = data.items;
      } else if (Array.isArray(data)) {
        articles = data;
      }

      // 排除当前文章
      if (excludeArticleId) {
        articles = articles.filter(article =>
          article.id !== excludeArticleId &&
          article.id !== parseInt(excludeArticleId)
        );
      }

      // 限制数量
      articles = articles.slice(0, limit);

      // 缓存结果
      this.cache.set(cacheKey, articles);
      return articles;

    } catch (error) {
      console.error('获取相关文章失败:', error);
      return []; // 返回空数组而不是抛出错误
    }
  }

  // 根据分类获取文章
  async getArticlesByCategory(categoryId, excludeId = null, limit = 6) {
    try {
      console.log(`获取分类文章: categoryId=${categoryId}, excludeId=${excludeId}, limit=${limit}`);

      // 构建请求参数
      const params = new URLSearchParams({
        'page': '0',
        'limit': limit.toString(),
        'sort': 'created',
        'order': 'DESC'
      });

      // 添加分类过滤条件
      if (categoryId) {
        params.set('filter[field_article_category.target_id]', categoryId.toString());
      }

      // 如果有排除的文章ID，添加到过滤条件
      if (excludeId) {
        params.set('filter[nid][operator]', '!=');
        params.set('filter[nid][value]', excludeId.toString());
      }

      const url = `${this.baseUrl}/content/article?${params.toString()}`;
      console.log('分类文章请求URL:', url);

      const response = await this.makeRequest(url);
      console.log('分类文章响应:', response);

      // 处理响应数据
      if (response && response.data) {
        return response.data;
      } else if (Array.isArray(response)) {
        return response;
      } else {
        console.warn('分类文章响应格式不符合预期:', response);
        return [];
      }
    } catch (error) {
      console.error('获取分类文章失败:', error);

      // 如果按分类获取失败，尝试获取所有文章然后手动过滤
      try {
        console.log('尝试获取所有文章进行手动过滤...');
        const allArticles = await this.getArticles({ limit: 20 });
        let articles = allArticles.data || allArticles || [];

        // 如果有分类ID，手动过滤分类
        if (categoryId) {
          articles = articles.filter(article => {
            const categoryField = article.fields?.field_article_category;
            if (!categoryField) return false;

            const articleCategoryId =
              categoryField.data?.id ||
              categoryField.target_id ||
              categoryField.id ||
              categoryField;

            return articleCategoryId == categoryId;
          });
        }

        // 排除当前文章
        if (excludeId) {
          articles = articles.filter(article => article.id != excludeId);
        }

        // 限制数量
        articles = articles.slice(0, limit);

        console.log('手动过滤后的分类文章:', articles);
        return articles;
      } catch (fallbackError) {
        console.error('手动过滤也失败:', fallbackError);
        return [];
      }
    }
  }
}

// 创建全局实例
const contentApiService = new ContentApiService();

// 监听语言变化事件，清理相关缓存
window.addEventListener('languageChanged', (event) => {
  contentApiService.clearCache();
});

// 向后兼容的导出
export default contentApiService;

// 同时导出为 drupalApi 以保持向后兼容
export { contentApiService as drupalApi };
