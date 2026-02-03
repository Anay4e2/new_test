from playwright.sync_api import sync_playwright

def debug_add_diamond():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to login...")
        page.goto("http://localhost:5173/login")

        print("Filling login form...")
        page.fill('input[type="email"]', "admin@test.com")
        page.fill('input[type="password"]', "password")
        page.click('button[type="submit"]')

        # Wait for dashboard
        page.wait_for_selector('text=CRM Carbon')

        # Go to Diamonds
        print("Navigating to Diamonds...")
        page.click('a[href="/diamonds"]')
        page.wait_for_selector('text=Diamond Inventory')

        # Add Diamond
        print("Adding Diamond...")
        page.click('button:has-text("Add Diamond")')

        page.fill('input[name="sku"]', "TEST-999")
        page.fill('input[name="carat"]', "1.5")
        page.fill('input[name="cost_price"]', "1000")
        page.fill('input[name="margin_percentage"]', "20")

        page.click('button:has-text("Save Diamond")')

        # Wait a bit for update
        page.wait_for_timeout(2000)

        print("Taking debug screenshot...")
        page.screenshot(path="verification/debug_diamond_fail.png")

        browser.close()

if __name__ == "__main__":
    debug_add_diamond()
