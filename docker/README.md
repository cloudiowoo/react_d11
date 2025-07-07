# Docker 配置说明

## 初始设置

1. 复制示例配置文件：
   ```bash
   cp docker-compose.yml.example docker-compose.yml
   ```

2. 修改 `docker-compose.yml` 中的配置：
   - 设置 PostgreSQL 密码
   - 配置网络 IP 地址
   - 修改本地域名配置

## 目录结构

```
docker/
├── Dockerfile.8.4.xdebug    # PHP-FPM 构建文件
├── docker-compose.yml       # Docker 编排配置（本地）
├── docker-compose.yml.example # 示例配置文件（版本控制）
├── fpm/                    # PHP-FPM 配置
├── nginx/                  # Nginx 配置
└── pg/                     # PostgreSQL 数据和日志
```

## 注意事项

- `docker-compose.yml` 包含敏感信息，不要提交到版本控制
- 所有服务的数据和日志目录已配置在 `.gitignore` 中
- 开发环境已配置 Xdebug 支持
