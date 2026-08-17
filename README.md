# Material 3 Blog Template
![](https://esaimg.cdn1.vip/i/6a834ada994fe_1786989274.webp)

![](https://esaimg.cdn1.vip/i/6a83386f7cf40_1786984559.webp)

一个无需构建的静态 Material 3 博客模板。设计优雅，符合Material Design设计规范，支持图片自动取色，全站覆盖取色！无须购买任何服务器即可实现强大的后台管理系统！国内正常速度访问！

## 部署

🇨🇳推荐先部署在GitHub上，再用Cloudflare免费托管，这样确保国内基本访问。

## 开始

部署后打开：

```text
/admin.html
```

🇨🇳注意这里是需要国际互联网配置的！

先填写 GitHub 仓库信息并连接，然后保存站点配置。你需要需要准备一个具有仓库内容读写权限的 GitHub Token 以供网站向 GitHub 提交内容。

Admin 的修改会直接同步到 GitHub；前台通过 `site.config.json`、`posts/posts.json` 和 Markdown 文件读取内容。

---

# Admin 重点配置说明

这里仅讲解重点内容，其余内容在 Admin 中简单易懂，上手较快。
## 首页头图

Admin → **首页头图轮播**。

每张头图都可以这样：

- 上传图片
- 填写图片 URL
- 调整顺序
- 删除
- 自动取色
- 手动修改主题色

>图片逻辑是这样的：你可以选择就放在 GitHub 上由 Cloudflare 托管，也可以找国内能访问的图床来填写URL

### 两种操作方式：

1. 🇨🇳我要考虑国内用户：
	- 先从本地上传图片，这时已经取色，URL 一栏是空的；
	- 将你的国内图床图片直链填入；
	- 点击两个保存
	- 这时图片不会上传 GitHub，仅图片取色、URL、顺序配置会上传到 GitHub，速度大大提高。
	>注：部分开启 CORS 的图床可以直接使用批量URL传功能，否则无法自动取色
2. 我网很好：
	- 先从本地上传图片，这时已经取色，URL一栏是空的；
	- 无须填写 URL，直接点击两个保存，图片及配置会自动上传到 GitHub，由 Cloudflare 托管，国内速度一般


---

## 主页封面和文内头图

一篇文章现在可以有两张图：

### 主页封面

用于首页文章卡片。

### 文内头图

用于文章页面标题上方。

两者可以不同。

例如：

```text
主页封面：
images/post-home.jpg（或者直链URL）

文内头图：
images/post-article.jpg（或者直链URL）
```

如果只想使用一张：

```text
主页封面：images/post.jpg（或者直链URL）
文内头图：留空
```

或者反过来。

**其中一个为空时，系统自动把另一个作为两处图片。**

两处都支持直接填写 URL。

🇨🇳推荐直接填写国内图床的URL，但是依旧是和主页头图取色一样的限制，你必须先本地上传完成取色再填写该图URL

---
## Giscus 评论系统

如果需要评论，在 Admin 中开启 Giscus，然后这样配置：

| 配置项                | 值                              |
| :----------------- | :----------------------------- |
| **Repository**     | 仓库名称，例如`YourName/YourBlogName` |
| **Category**       | `Announcements`                |
| **Mapping**        | `specific`                     |
| **Reactions**      | `1`（启用）                        |
| **Emit Metadata**  | `0`（关闭）                        |
| **Input Position** | `top`（评论框在上方）                  |
| **Lazy load**      | 打开或关闭                          |
得到 ID 等数据后填入 Admin 即可

🇨🇳国内访问不稳定

---
## PWA / Service Worker

模板带有 Service Worker。

它会缓存常用静态资源，使用户第二次访问更快。

如果你刚更新了网站，但手机仍然看到旧版本，请清除缓存

不推荐自行修改前端文件，推荐使用 Admin 快速修改

---
