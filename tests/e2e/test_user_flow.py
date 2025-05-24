import pytest
from playwright.sync_api import Page, expect

def test_user_signup_and_wallet_creation(page: Page):
    # Navigate to the signup page
    page.goto("http://localhost:8080/signup")
    
    # Fill out the signup form
    page.fill("input[name='email']", "test@example.com")
    page.fill("input[name='password']", "SecurePassword123!")
    page.fill("input[name='confirmPassword']", "SecurePassword123!")
    page.click("button[type='submit']")
    
    # Wait for signup to complete and redirect to dashboard
    page.wait_for_url("**/dashboard")
    
    # Verify user is logged in
    expect(page.locator(".user-info")).to_contain_text("test@example.com")
    
    # Navigate to wallet creation
    page.click("text=Create Wallet")
    
    # Fill out wallet creation form
    page.fill("input[name='walletName']", "My Test Wallet")
    page.select_option("select[name='currency']", "USD")
    page.click("button[type='submit']")
    
    # Wait for wallet creation to complete
    page.wait_for_selector(".wallet-card")
    
    # Verify wallet was created successfully
    expect(page.locator(".wallet-card")).to_contain_text("My Test Wallet")
    expect(page.locator(".wallet-card")).to_contain_text("USD")
    expect(page.locator(".wallet-balance")).to_contain_text("$0.00")
    
    # Cleanup - logout
    page.click(".user-menu")
    page.click("text=Logout")
    
    # Verify logout was successful
    expect(page.locator("h1")).to_contain_text("Welcome to Flowlet")
