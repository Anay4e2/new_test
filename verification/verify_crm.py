from playwright.sync_api import sync_playwright, expect

def verify_crm():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Login
        print("Navigating to login...")
        page.goto("http://localhost:5173/login")

        print("Filling login form...")
        page.fill('input[type="email"]', "admin@test.com")
        page.fill('input[type="password"]', "password")
        page.click('button[type="submit"]')

        # 2. Verify Dashboard
        print("Verifying dashboard...")
        # Increase timeout to 30s because of DB timeout delays
        expect(page.get_by_text("CRM Carbon")).to_be_visible(timeout=30000)
        expect(page.get_by_text("Total Diamonds")).to_be_visible()

        # 3. Go to Diamonds
        print("Navigating to Diamonds...")
        page.click('a[href="/diamonds"]')
        expect(page.get_by_text("Diamond Inventory")).to_be_visible()

        # Wait for loading to finish (could take 10s+)
        expect(page.get_by_text("Loading inventory...")).not_to_be_visible(timeout=30000)

        # 4. Add Diamond
        print("Adding Diamond...")
        page.click('button:has-text("Add Diamond")')

        page.fill('input[name="sku"]', "TEST-999")
        page.fill('input[name="carat"]', "1.5")
        page.fill('input[name="cost_price"]', "1000")
        page.fill('input[name="margin_percentage"]', "20")

        page.click('button:has-text("Save Diamond")')

        # 5. Verify in list
        print("Verifying in list...")
        # Saving also takes time (DB timeout)
        expect(page.get_by_text("TEST-999").first).to_be_visible(timeout=30000)
        expect(page.get_by_text("$1200.00").first).to_be_visible() # 1000 + 20%

        # 6. Screenshot
        print("Taking screenshot...")
        page.screenshot(path="verification/crm_verification.png")

        browser.close()
        print("Verification successful!")

if __name__ == "__main__":
    verify_crm()
