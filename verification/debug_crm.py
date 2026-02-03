from playwright.sync_api import sync_playwright

def debug_crm():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to login...")
        page.goto("http://localhost:5173/login")

        print("Filling login form...")
        page.fill('input[type="email"]', "admin@test.com")
        page.fill('input[type="password"]', "password")
        page.click('button[type="submit"]')

        # Wait a bit
        page.wait_for_timeout(3000)

        print("Taking debug screenshot...")
        page.screenshot(path="verification/debug_login.png")

        browser.close()

if __name__ == "__main__":
    debug_crm()
