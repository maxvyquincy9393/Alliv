# Page snapshot

```yaml
- generic [ref=e4]:
  - link "Back to Login" [ref=e5]:
    - /url: /login
    - img [ref=e6]
    - text: Back to Login
  - link "Alliv" [ref=e8]:
    - /url: /
    - heading "Alliv" [level=1] [ref=e9] [cursor=pointer]
  - generic [ref=e10]:
    - heading "Forgot Password?" [level=2] [ref=e11]
    - paragraph [ref=e12]: No worries! Enter your email and we'll send you a verification code to reset your password.
    - generic [ref=e13]:
      - generic [ref=e14]:
        - generic [ref=e15]: Email Address
        - textbox "you@example.com" [active] [ref=e16]
      - button "Send Reset Code" [ref=e17] [cursor=pointer]
    - paragraph [ref=e19]:
      - text: Remember your password?
      - link "Sign in" [ref=e20]:
        - /url: /login
```