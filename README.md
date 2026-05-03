# Bisma Shahbaz — Author Website

Personal website for author Bisma Shahbaz. Built with vanilla HTML/CSS/JS, managed via Decap CMS, hosted on Netlify.

## 📁 Structure

```
bisma-site/
├── index.html          # Home page
├── about.html          # About page
├── books.html          # Books page
├── articles.html       # Articles page
├── shop.html           # Shop & Links page
├── contact.html        # Contact page
├── style.css           # Shared styles
├── main.js             # Shared JS
├── netlify.toml        # Netlify config
├── admin/
│   ├── index.html      # CMS login
│   └── config.yml      # CMS configuration
└── content/
    ├── books/          # Each book = one .md file
    ├── articles/       # Each article = one .md file
    └── settings/       # Site-wide settings
        ├── homepage.json
        ├── about.json
        ├── links.json
        └── newsletter.json
```

## 🔐 Admin Access

Go to `/admin` on the live site. Log in with Netlify Identity credentials.

## 🚀 Deployment

Connected to Netlify. Any push to `main` branch auto-deploys.
