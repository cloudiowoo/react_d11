# Drupal 11 + React Full Stack Application

[English](README_EN.md) | [中文](README.md)

A modern full-stack application framework built on Drupal 11 and React 18, implementing best practices for content management and frontend interaction.
This project's React theme is custom-developed based on Drupal 11's default demo data (Umami recipes), providing a complete reference implementation.

## 💡 Features

- **Complete Demo**: Developed based on Drupal 11 Umami demo data
- **Multilingual Support**: English, Chinese, Spanish
- **Responsive Design**: Perfect for both mobile and desktop
- **Modern Interaction**: SPA experience + Server-side rendering
- **Ready to Use**: Run directly after installing demo data
- **Automated Build**: Installation and live compilation upon container startup

## 🏗️ Architecture Overview

### Tech Stack
- **Backend**: Drupal 11 (PHP 8.4)
- **Frontend**: React 18 + Vite
- **Theme**: Custom React theme
- **Database**: PostgreSQL 17
- **Cache**: Redis (optional)

### Architecture Features
```
Project Structure
├── web/                        # Drupal root
│   ├── modules/custom/         # Custom modules
│   │   └── react_api/         # React API module
│   └── themes/custom/react/   # React theme
│       ├── react-src/         # React source code
│       ├── js/                # Compiled JS
│       └── templates/         # Drupal templates
├── docker/                    # Docker configuration
└── composer.json             # Drupal dependency management
```

## 🎯 Business Scenario Comparison

### Suitable Scenarios
- Need powerful content management + modern frontend experience
- Complex content workflow + rich interactive interface
- Multilingual, multi-site + SPA user experience
- Enterprise content platform + consumer-grade UI

### Comparison with Traditional Architecture

| Feature | Drupal + React | Pure Drupal | Pure React |
|---------|---------------|-------------|------------|
| Content Management | ✅ Powerful | ✅ Powerful | ❌ Need to build |
| Frontend Experience | ✅ Excellent | ⚠️ Average | ✅ Excellent |
| Development Efficiency | ⚠️ Needs coordination | ✅ High | ✅ High |
| Maintainability | ✅ Clear separation | ✅ High | ✅ High |
| SEO | ✅ Supported | ✅ Native | ⚠️ Needs optimization |

## 🔗 Key Integration Files

### Drupal-React Integration
1. **Module Integration**
   ```
   web/modules/custom/react_api/
   ├── react_api.routing.yml      # API route definitions
   └── src/Controller/           # API controllers
   ```

2. **Theme Integration**
   ```
   web/themes/custom/react/
   ├── react.libraries.yml       # Resource loading config (auto-updated)
   ├── templates/               # Drupal templates
   └── react-src/              # React application
   ```

3. **Data Flow**
   - Drupal provides RESTful API
   - React consumes API through ContentApiService
   - Supports multilingual content sync

## 🚀 Quick Start

1. **Environment Setup**
   ```bash
   # Copy and configure docker-compose.yml
   cp docker/docker-compose.yml.example docker/docker-compose.yml
   # Modify database password and other configs as needed

   # Start all services
   # node-test-vite container will automatically:
   # 1. Install npm dependencies
   # 2. Start file watching
   # 3. Auto-compile on changes
   # 4. Update libraries.yml
   docker-compose up -d
   ```

2. **Install Drupal**
   ```bash
   # Install dependencies
   composer install

   # Install Drupal (choose Demo: Umami Food Magazine (Experimental))
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush site:install demo_umami \
     --db-url=pgsql://postgres:[your+db+password]@pg17:5432/[your+db] \
     --account-name=[your+name] \
     --account-pass=[your+password] \
     --site-name='Drupal 11 + React Demo' \
     -y"
   ```

   After installation, you can configure the system using either of these two methods:

   ### A. Configure via Admin UI (Recommended)

   1. **Enable Required Modules**
      - Visit `http://local.test.d11.com/admin/modules`
      - Check and enable the following modules:
        - React API (Custom module)
        - JSON:API (API dependency)
        - RESTful Web Services (API dependency)
      - Click "Install" button

   2. **Language Settings**
      - Visit `http://local.test.d11.com/admin/config/regional/language`
      - Add Chinese (Simplified) and Spanish
      - Set English as the default language
      - In "Detection and Selection" settings:
        - Visit `http://local.test.d11.com/admin/config/regional/language/detection`
        - Drag "URL language detection" to the top
        - Save configuration

   3. **Enable React Theme**
      - Visit `http://local.test.d11.com/admin/appearance`
      - Find "React Theme" and click "Set as default"
      - Visit `http://local.test.d11.com/admin/structure/block`
      - Keep only "Main page content" block, disable all others

   ### B. Configure via Command Line

   ```bash
   # Enable required modules
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush en react_api jsonapi rest -y"

   # Multilingual settings optimization
   # Enable multilingual support and add languages
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush en locale -y"
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush language-add zh-hans"
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush language-add es"

   # Set English as default language
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush language-default en"

   # Configure language detection order, set URL detection as primary
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush config:set language.types.negotiation.language_interface.enabled path 1 -y"
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush config:set language.types.negotiation.language_interface.enabled language-browser 2 -y"
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush config:set language.types.negotiation.language_interface.enabled user 3 -y"

   # Enable React theme
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush theme:enable react -y"
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush config:set system.theme default react -y"

   # Clean up block settings (keep only page content)
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush config:set block.block.react_content status 1 -y"
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush config:set block.block.react_breadcrumbs status 0 -y"
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush config:set block.block.react_help status 0 -y"
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush config:set block.block.react_messages status 0 -y"
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush config:set block.block.react_page_title status 0 -y"
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush config:set block.block.react_primary_local_tasks status 0 -y"
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush config:set block.block.react_secondary_local_tasks status 0 -y"

   # Clear cache to apply changes
   docker exec -it php8-4-fpm-xdebug sh -c "cd /var/www/webs/test_d11 && vendor/bin/drush cr"
   ```

3. **Development Automation**
   ```bash
   # Check React auto-build status
   docker logs -f node-test-vite

   # All React source code changes will automatically:
   # - Trigger recompilation
   # - Generate new file hash
   # - Update libraries.yml
   # - Preview changes in real-time

   # Clear Drupal cache when needed
   docker exec -it php8-4-fpm-xdebug drush cr
   ```

## 📱 Demo Features

### Implemented Features
- ✅ Responsive homepage
- ✅ Recipe list and details
- ✅ Article list and details
- ✅ Language switching
- ✅ Real-time search
- ✅ Category filtering
- ✅ Tag cloud display

### Page Preview
- Homepage: `http://local.test.d11.com/`
- Recipe List: `http://local.test.d11.com/recipes`
- Article List: `http://local.test.d11.com/articles`
- Admin Panel: `http://local.test.d11.com/admin`
  - Username: `your+name`
  - Password: `your+password`

## 🔄 Development Workflow

### React Automated Development
1. **Container Automation**
   - Auto-install npm dependencies on container start
   - Auto-start file watching service
   - Auto-detect source code changes
   - Auto-execute compilation process

2. **Build Automation**
   - Auto-trigger build on changes
   - Auto-generate hashed filenames
   - Auto-update Drupal library config
   - Support hot reload and live preview

3. **Debugging Methods**
   - View build logs in real-time: `docker logs -f node-test-vite`
   - Monitor build output: `web/themes/custom/react/js/`
   - Check library config: `web/themes/custom/react/react.libraries.yml`

### Development Tips
- No need to manually run npm install
- No need to manually start build service
- Auto-compile on file save
- Browser auto-loads latest version

## 📚 More Documentation

- [React Theme Development Guide](web/themes/custom/react/README-DEVELOPMENT.md)
- [Docker Environment Configuration](docker/README.md)
- [API Documentation](web/modules/custom/react_api/README.md)
