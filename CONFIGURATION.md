# Material 3 Blog Template

一个**无需构建、开箱即用的纯静态 Material 3 博客模板**。

适合部署到 Cloudflare Pages、GitHub Pages、Vercel 等静态托管平台。整个博客不需要 Node.js、npm 或数据库即可运行；文章使用 Markdown，站点内容通过 `assets/site.config.json` 配置。

## 特性

- Material 3 / Material You 风格 UI
- 明暗主题与跟随系统主题
- 背景图动态取色
- 首页头图轮播与自动切换
- 头图切换时主题色同步变化
- 文章独立文内头图与主题色
- Markdown 渲染
- 支持 Markdown 一级至五级标题
- 右侧文章目录默认显示二、三级标题
- 文章标题、Markdown 小标题、列表序号/圆点跟随文内头图主题色
- 文章阅读进度
- 搜索与分类筛选
- 文章上一篇/下一篇导航
- 分享按钮
- 点赞功能，可自动回退到本地 localStorage
- Giscus 评论，可选启用
- PWA / Service Worker
- 响应式布局，适配手机、平板和桌面
- Admin 管理页
- Admin 支持 GitHub 同步文章与站点配置
- Admin 支持上传/管理首页头图
- Admin 支持头图自动取色与手动颜色
- Admin 文章头图支持 URL 直链
- 主页封面与文内头图可分别设置；任意一个为空时自动使用另一个
- 无 npm 构建步骤

---

## 一、目录结构

```text
.
├── index.html                 # 首页
├── article.html               # 文章页
├── about.html                 # 关于页
├── admin.html                 # 管理后台
├── 404.html                   # 404 页面
├── assets/
│   ├── site.config.json       # 核心配置文件
│   ├── main.js                # 首页逻辑
│   ├── article.js             # 文章页逻辑
│   ├── admin.js               # 管理后台逻辑
│   ├── markdown.js            # Markdown 渲染
│   ├── shared.js              # 公共逻辑
│   ├── theme-engine.js        # 动态主题色
│   └── style.css              # 样式
├── images/                    # 图片
├── posts/
│   ├── posts.json             # 文章索引
│   └── *.md                   # Markdown 文章
├── functions/api/likes.js     # Cloudflare D1 点赞接口
├── sw.js                      # Service Worker
├── manifest.webmanifest       # PWA 配置
└── _headers / _redirects      # Cloudflare 配置
```

---

# 二、最重要：`assets/site.config.json`

绝大多数设置都在这里完成。

## 1. 网站基本信息

```json
"site": {
  "name": "我的博客",
  "shortName": "博客",
  "tagline": "YOUR TAGLINE",
  "author": "你的名字",
  "description": "一个个人博客。",
  "language": "zh-CN",
  "copyright": "© 2026 你的名字",
  "email": ""
}
```

| 字段 | 作用 |
|---|---|
| `name` | 网站完整名称，浏览器标题等位置使用 |
| `shortName` | 短名称，适合移动端/PWA |
| `tagline` | 网站副标题 |
| `author` | 作者名称 |
| `description` | 网站描述，也用于 SEO |
| `language` | 网站语言，例如 `zh-CN`、`en-US` |
| `copyright` | 页脚版权文字 |
| `email` | 联系邮箱，可留空 |

---

# 三、首页文字

```json
"home": {
  "eyebrow": "个人博客",
  "title": "记录所见，\n分享所思。",
  "intro": "在这里分享文章、作品、技术记录与个人思考。",
  "chips": ["技术", "随笔", "创作"]
}
```

### `title`

使用 `\n` 换行：

```json
"title": "第一行\n第二行"
```

### `chips`

首页标题下方的标签：

```json
"chips": ["摄影", "编程", "旅行", "音乐"]
```

---

# 四、顶部公告

```json
"banner": {
  "enabled": true,
  "variant": "theme",
  "showClose": true,
  "label": "公告",
  "title": "网站更新",
  "message": "这里填写公告正文。",
  "link": "https://example.com",
  "linkLabel": "查看详情"
}
```

### 关闭公告

```json
"enabled": false
```

### 公告颜色

```json
"variant": "theme"
```

使用主题色。

```json
"variant": "danger"
```

使用错误/警告色。

### 关闭按钮

```json
"showClose": true
```

设置为 `false` 后访客不能手动关闭。

---

# 五、首页头图轮播

配置位置：

```json
"theme": {
  "heroCarousel": {
    "enabled": true,
    "autoplay": true,
    "interval": 4000,
    "images": []
  }
}
```

## 基本配置

```json
"heroCarousel": {
  "enabled": true,
  "autoplay": true,
  "interval": 4000,
  "images": [
    {
      "src": "images/head01.jpeg",
      "color": ""
    },
    {
      "src": "https://example.com/head.jpg",
      "color": "#6688AA"
    }
  ]
}
```

### `enabled`

是否启用轮播。

### `autoplay`

是否自动播放。

### `interval`

自动切换间隔，单位毫秒：

```json
"interval": 4000
```

即 4 秒切换一次。

### `src`

可以填写：

```text
images/head01.jpeg
```

也可以填写外部直链：

```text
https://example.com/image.webp
```

### `color`

可以留空，让博客自动从图片取色：

```json
"color": ""
```

也可以手动指定颜色：

```json
"color": "#6688AA"
```

指定颜色后，该图片会使用指定颜色作为主题色种子。

---

# 六、动态主题色

```json
"theme": {
  "defaultMode": "system",
  "dynamicColor": true,
  "seedColor": "#6750A4",
  "source": "background"
}
```

## `defaultMode`

可选：

```text
system
light
dark
```

`system` 会跟随系统。

## `dynamicColor`

```json
"dynamicColor": true
```

开启 Material You 动态取色。

关闭：

```json
"dynamicColor": false
```

此时使用 `seedColor`。

## `seedColor`

默认主题色：

```json
"seedColor": "#6750A4"
```

必须使用 6 位十六进制颜色。

---

# 七、背景图

```json
"background": {
  "enabled": true,
  "image": "images/background.jpeg",
  "position": "center center",
  "size": "cover",
  "blur": 18,
  "opacityLight": 0.055,
  "opacityDark": 0.07,
  "overlayLight": 0.9,
  "overlayDark": 0.9
}
```

### 图片

```json
"image": "images/background.jpeg"
```

也可以使用 URL：

```json
"image": "https://example.com/background.jpg"
```

### `blur`

背景模糊程度。

### `opacityLight` / `opacityDark`

控制背景图片在浅色/深色模式中的显示强度。

### `overlayLight` / `overlayDark`

控制背景覆盖层强度。

如果希望背景图片更明显，可以降低 overlay 并适当提高 opacity；如果希望更加干净，则反向调整。

---

# 八、功能开关

```json
"features": {
  "search": true,
  "pwa": true,
  "readingProgress": true,
  "toc": true,
  "share": true,
  "backToTop": true
}
```

| 配置 | 功能 |
|---|---|
| `search` | 首页文章搜索 |
| `pwa` | PWA / Service Worker |
| `readingProgress` | 文章阅读进度条 |
| `toc` | 文章右侧目录 |
| `share` | 分享按钮 |
| `backToTop` | 返回顶部 |

全部使用 `true / false`。

---

# 九、文章系统

文章由两部分组成：

```text
posts/posts.json
posts/文章文件.md
```

## 1. 新建 Markdown

例如：

```text
posts/my-first-post.md
```

内容：

```markdown
# 我的第一篇文章

这是文章正文。

## 第一章

正文。

### 第一节

正文。

#### 四级标题

正文。

##### 五级标题

正文。
```

博客支持到五级 Markdown 标题。

---

# 十、`posts/posts.json`

每篇文章对应一个对象：

```json
[
  {
    "file": "my-first-post",
    "cat": "tech",
    "category": "技术",
    "log": "POST",
    "title": "我的第一篇文章",
    "desc": "文章简介",
    "date": "2026-08-17",
    "time": "5 min",
    "coverHome": "images/cover01.jpeg",
    "coverArticle": "images/cover01.jpeg",
    "cover": "images/cover01.jpeg",
    "coverColorHome": "",
    "coverColorArticle": "",
    "featured": true,
    "tags": ["技术", "教程"]
  }
]
```

### `file`

必须与 Markdown 文件名一致，但**不要写 `.md`**：

```text
file: my-first-post
```

对应：

```text
posts/my-first-post.md
```

建议使用英文、数字和 `-`，避免特殊字符导致静态服务器 URL 编码问题。

### `cat`

内部分类 ID，例如：

```json
"cat": "tech"
```

### `category`

显示给访客的分类名称：

```json
"category": "技术"
```

### `log`

文章类型标签，例如：

```json
"log": "POST"
```

### `desc`

首页卡片上的文章简介。

### `date`

文章日期。

### `time`

显示的阅读时间，例如：

```json
"time": "5 min"
```

### `featured`

是否作为特色文章：

```json
"featured": true
```

### `tags`

文章标签数组：

```json
"tags": ["JavaScript", "教程"]
```

---

# 十一、文章封面：主页封面与文内头图

这是模板特别支持的功能。

文章可以拥有两张不同的图片：

```json
"coverHome": "images/home-cover.jpg",
"coverArticle": "images/article-cover.jpg"
```

- `coverHome`：首页文章卡片使用
- `coverArticle`：文章页面顶部使用

### 两者使用同一张图

可以写成：

```json
"coverHome": "images/cover.jpg",
"coverArticle": "images/cover.jpg"
```

### 只填写主页封面

```json
"coverHome": "images/cover.jpg",
"coverArticle": ""
```

文章页会自动使用 `coverHome`。

### 只填写文内头图

```json
"coverHome": "",
"coverArticle": "images/article.jpg"
```

首页会自动使用 `coverArticle`。

### 使用外部图片

两者都支持 URL：

```json
"coverHome": "https://example.com/home.jpg",
"coverArticle": "https://example.com/article.jpg"
```

### 颜色

可以让系统自动取色：

```json
"coverColorHome": "",
"coverColorArticle": ""
```

也可以手动指定：

```json
"coverColorArticle": "#7A8FB8"
```

文章页面会优先使用文内头图的主题色。

文章标题、Markdown 小标题以及列表序号/圆点都会跟随该主题色。

---

# 十二、文章目录

右侧目录默认只显示：

- `##`
- `###`

即 Markdown 二级、三级标题。

`####` 和 `#####` 仍然支持正常渲染，但默认不会塞进右侧目录，从而保持目录简洁。

可以通过：

```json
"toc": false
```

关闭目录。

---

# 十三、点赞

```json
"likes": {
  "enabled": true,
  "mode": "auto",
  "endpoint": "/api/likes"
}
```

### `enabled`

```json
"enabled": false
```

即可关闭点赞。

### `mode`

推荐：

```json
"mode": "auto"
```

没有 Cloudflare D1 时自动回退到浏览器本地存储。

如果配置了 D1，可以使用全站点赞计数。

---

# 十四、Giscus 评论

默认关闭：

```json
"comments": {
  "enabled": false
}
```

如果需要评论：

1. 在 GitHub 仓库开启 Discussions。
2. 打开 Giscus 配置页面生成配置。
3. 填入：

```json
"comments": {
  "enabled": true,
  "provider": "giscus",
  "repo": "用户名/仓库名",
  "repoId": "仓库 ID",
  "category": "Announcements",
  "categoryId": "分类 ID",
  "mapping": "specific",
  "reactionsEnabled": "1",
  "emitMetadata": "0",
  "inputPosition": "top",
  "lang": "zh-CN",
  "loading": "lazy"
}
```

其中 `repoId` 和 `categoryId` 必须使用 Giscus 提供的真实值。

---

# 十五、社交链接

```json
"social": [
  {
    "label": "GitHub",
    "url": "https://github.com/example"
  },
  {
    "label": "哔哩哔哩",
    "url": "https://space.bilibili.com/example"
  }
]
```

不需要时直接：

```json
"social": []
```

---

# 十六、Admin 管理后台

访问：

```text
/admin.html
```

Admin 可以管理：

- 网站信息
- 首页文字
- 公告
- 首页头图轮播
- 动态主题色
- 文章
- 文章封面
- 文章分类与标签
- GitHub 同步
- Giscus 配置

## GitHub 配置

```json
"admin": {
  "githubOwner": "你的 GitHub 用户名",
  "githubRepo": "你的仓库名",
  "githubBranch": "main",
  "password": ""
}
```

### 管理密码

可以设置：

```json
"password": "你的密码"
```

但需要注意：**这是纯静态网站，配置文件会公开，因此该密码不是高强度安全认证机制。**

如果不需要密码：

```json
"password": ""
```

---

# 十七、Admin 文章头图

后台文章编辑支持：

- 主页封面
- 文内头图
- URL 直链
- 本地图片
- 自动取色
- 手动指定颜色

主页封面和文内头图任意一个不填写时，自动使用另一个。

因此最简单的文章配置只需要一张图即可。

---

# 十八、Cloudflare Pages 部署

推荐使用 Cloudflare Pages。

## 设置

- Framework preset：`None`
- Root directory：留空
- Build command：留空
- Build output directory：`.`
- Production branch：`main`

整个项目没有构建步骤。

部署后：

```text
https://你的域名/
https://你的域名/article.html?post=welcome
https://你的域名/admin.html
```

---

# 十九、GitHub Pages 部署

如果使用 GitHub Pages：

1. 将整个项目上传到仓库。
2. 打开仓库 Settings → Pages。
3. Source 选择 GitHub Actions 或从 branch 发布。
4. 发布根目录。

如果项目部署在子路径下，需要根据你的部署方式调整站点中的相对路径策略。

---

# 二十、Service Worker / PWA

项目包含：

```text
sw.js
manifest.webmanifest
```

用于缓存静态资源和支持 PWA。

如果修改了核心 JS/CSS 后浏览器仍然显示旧版本，可以：

1. 更新 `sw.js` 中的缓存版本名。
2. 清除浏览器站点数据。
3. 重新打开网站。

---

# 二十一、修改 Logo / 图标

主要资源：

```text
assets/favicon.svg
assets/icon.png
```

PWA 图标也可以在：

```text
manifest.webmanifest
```

中修改。

---

# 二十二、常见问题

## 修改 JSON 后网站没有变化

检查 JSON 是否有效，然后清除 Service Worker 缓存。

## 文章显示“文章加载失败”

检查：

```text
posts/posts.json
posts/文章名.md
```

其中 `file` 必须与 Markdown 文件名一致。

例如：

```json
"file": "my-post"
```

必须存在：

```text
posts/my-post.md
```

## 文章图片不显示

确认图片 URL 可以直接在浏览器打开，并检查图片服务器是否允许跨域访问。

## 动态颜色不正确

可以在文章的：

```json
"coverColorArticle": "#颜色"
```

手动指定主题色。

首页头图也可以在：

```json
"theme.heroCarousel.images[].color"
```

中手动指定。

## Admin 无法同步 GitHub

检查：

- Owner
- Repository
- Branch
- Fine-grained PAT
- Token 对仓库内容是否具有读写权限

不要把 PAT 写进公开的 `site.config.json`。

---

# 二十三、安全说明

这是一个**纯静态博客模板**。Admin 的 GitHub Token 只应该保存在管理员自己的浏览器中，不应该提交进仓库。

`admin.password` 只是前端访问门槛，不应该被视为真正的服务器端身份认证。

如果需要高安全级别的后台，请将管理接口放到服务端，并使用真正的身份认证系统。

---

# 二十四、快速开始

最简单的使用流程：

```text
1. Fork / 下载模板
        ↓
2. 修改 assets/site.config.json
        ↓
3. 删除 posts/welcome.md
        ↓
4. 新建自己的 Markdown 文章
        ↓
5. 更新 posts/posts.json
        ↓
6. 替换 images/ 中的图片
        ↓
7. 部署到 Cloudflare Pages
```

如果使用 Admin，则可以直接通过 `/admin.html` 管理文章和站点配置。

---

## License

本模板的具体授权方式请根据你的实际发布需求补充。若公开发布，建议在仓库中明确写出许可证文件，例如 MIT License。
