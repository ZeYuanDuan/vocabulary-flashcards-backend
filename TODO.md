### 實做筆記

1. 將環境變數中的 Google callback URL 改到雲端伺服器的開放位置，前端只要向 /auth/google 送請求，就能轉址到 Google 登入頁面

### 待辦事項

1. 將 CommonJS 語法轉換為 ES Module 語法，使用 Babel 轉換

用來測試 Google 第三方登入的路由

```JavaScript
function setupDevRoutes() {
  // Google OAuth 測試頁面
  router.get("/test/auth/google", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Google OAuth Test</title>
      </head>
      <body>
        <h1>Google OAuth 2.0 Test</h1>
        <a href="/auth/google">Login with Google</a>
        <form id="logout-form" action="/logout" method="POST" style="display: none;">
          <input type="submit" value="Logout">
        </form>
        <a href="#" onclick="document.getElementById('logout-form').submit(); return false;">Logout</a>
        <h1>Vocabulary Form</h1>
        <form action="/vocabularies" method="POST">
          <div>
            <label for="english">English:</label>
            <input type="text" id="english" name="english" required>
          </div>
          <div>
            <label for="chinese">Chinese:</label>
            <input type="text" id="chinese" name="chinese">
          </div>
          <div>
            <label for="definition">Definition:</label>
            <textarea id="definition" name="definition"></textarea>
          </div>
          <div>
            <label for="example">Example:</label>
            <textarea id="example" name="example"></textarea>
          </div>
          <div>
            <button type="submit">Submit</button>
          </div>
        </form>
      </body>
      </html>
    `);
  });
}
```
