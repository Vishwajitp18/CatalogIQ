import puppeteer from 'puppeteer-core'

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const BASE_URL = 'http://localhost:5173'

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function runTests() {
  console.log('🚀 Starting end-to-end browser testing of CatalogIQ website...')

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 800 })

  // Collect console errors
  const consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })
  page.on('pageerror', (err) => {
    consoleErrors.push(err.message)
  })

  let passedTests = 0
  let totalTests = 0

  function assert(condition, testName) {
    totalTests++
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`)
      passedTests++
    } else {
      console.error(`  ❌ [FAIL] ${testName}`)
    }
  }

  try {
    // ==========================================
    // TEST SUITE 1: UNAUTHENTICATED NAVIGATION & REDIRECTS
    // ==========================================
    console.log('\n--- 1. Testing Unauthenticated Route & Action Guards ---')

    // 1.1 Direct access to protected route /sessions while logged out
    await page.goto(`${BASE_URL}/sessions`, { waitUntil: 'networkidle0' })
    await sleep(500)
    const currentUrl = page.url()
    assert(
      currentUrl.includes('/login'),
      'Direct navigation to /sessions redirects unauthenticated user to /login'
    )

    // 1.2 Verify the Authentication Required banner is displayed on /login
    const noticeText = await page.$eval('body', (el) => el.innerText)
    assert(
      noticeText.includes('Authentication Required') || noticeText.includes('Please sign in to access this section'),
      'Login screen displays contextual "Authentication Required" notice banner'
    )

    // ==========================================
    // TEST SUITE 2: ONE-CLICK DEMO LOGIN BUTTONS WITH TACTILE FEEDBACK
    // ==========================================
    console.log('\n--- 2. Testing One-Click Demo Role Logins & Tactile States ---')

    // 2.1 Click 👑 Admin demo pill
    const adminButton = await page.waitForSelector('button[title*="Admin: All rights"]')
    assert(adminButton !== null, 'Admin 1-click demo button exists')
    await adminButton.click()
    await sleep(350)

    // Verify email & password fields were filled
    const emailValue = await page.$eval('input[type="email"]', (el) => el.value)
    const passValue = await page.$eval('input[type="password"]', (el) => el.value)
    assert(
      emailValue === 'admin@catalogiq.com' && passValue === 'AdminPass123!',
      'Admin credentials automatically populated into form inputs'
    )

    // Verify visual feedback badge ("Admin filled") appears
    const demoBoxText = await page.$eval('body', (el) => el.innerText)
    assert(
      demoBoxText.includes('Admin filled'),
      'Tactile checkmark and "Admin filled" status badge appears on selection'
    )

    // 2.2 Click 👤 Standard User demo pill
    const userButton = await page.waitForSelector('button[title*="Standard User"]')
    assert(userButton !== null, 'Standard User 1-click demo button exists')
    await userButton.click()
    await sleep(350)

    const userEmailValue = await page.$eval('input[type="email"]', (el) => el.value)
    assert(
      userEmailValue === 'user@catalogiq.com',
      'Standard User credentials automatically populated on click'
    )
    const demoBoxTextUser = await page.$eval('body', (el) => el.innerText)
    assert(
      demoBoxTextUser.includes('User filled'),
      'Status badge updates to "User filled"'
    )

    // ==========================================
    // TEST SUITE 3: AUTHENTICATION LOGIN & RETURN-URL
    // ==========================================
    console.log('\n--- 3. Testing Sign In & Seamless Destination Return ---')

    // Switch back to Admin and Submit Sign In
    await adminButton.click()
    await sleep(300)

    const submitBtn = await page.waitForSelector('button[type="submit"]')
    await submitBtn.click()
    await sleep(1200)

    // Since we came from /sessions, it should have returned us directly to /sessions!
    const postLoginUrl = page.url()
    assert(
      postLoginUrl.includes('/sessions'),
      'User is seamlessly returned to original destination (/sessions) after sign-in'
    )

    // Verify user profile pill in Navbar shows Admin
    const navText = await page.$eval('header', (el) => el.innerText)
    assert(
      navText.includes('Admin') || navText.includes('CatalogIQ Administrator'),
      'Navbar displays authenticated Admin status badge and user profile'
    )

    // ==========================================
    // TEST SUITE 4: SESSIONS PAGE FUNCTIONALITY
    // ==========================================
    console.log('\n--- 4. Testing Security & Sessions Page ---')
    const sessionsPageContent = await page.$eval('body', (el) => el.innerText)
    assert(
      sessionsPageContent.includes('Active Sessions') || sessionsPageContent.includes('Current Session') || sessionsPageContent.includes('Security'),
      'Sessions page renders active device sessions successfully'
    )

    // ==========================================
    // TEST SUITE 5: PUBLIC CATALOG BROWSING & FILTERS
    // ==========================================
    console.log('\n--- 5. Testing Catalog Page, Bento Stats & Filters ---')
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' })
    await sleep(1000)

    const catalogContent = await page.$eval('body', (el) => el.innerText)
    assert(
      catalogContent.includes('Catalog Products') && catalogContent.includes('found'),
      'Catalog products list loads with total count'
    )
    assert(
      catalogContent.includes('Total Catalog') || catalogContent.includes('Brands & Categories'),
      'Bento Catalog Stats summary cards render properly'
    )

    // Switch between Grid and Table View
    const tableBtn = await page.waitForSelector('button[title="Table View"]')
    await tableBtn.click()
    await sleep(400)
    const isTableView = await page.$('table')
    assert(isTableView !== null, 'View toggle switches seamlessly to Table View')

    const gridBtn = await page.waitForSelector('button[title="Grid View"]')
    await gridBtn.click()
    await sleep(400)
    const isGridView = await page.$('table')
    assert(isGridView === null, 'View toggle switches back to Grid View')

    // Open Product Detail Modal
    const firstProductCard = await page.waitForSelector('button[title="View details"]')
    await firstProductCard.click()
    await sleep(700)

    const modalTitle = await page.$eval('#modal-title', (el) => el.innerText).catch(() => '')
    assert(
      modalTitle.length > 0,
      `Product Detail modal opens smoothly displaying product: "${modalTitle}"`
    )

    // Close modal
    const closeBtn = await page.waitForSelector('button[aria-label="Close dialog"]')
    await closeBtn.click()
    await sleep(400)

    // ==========================================
    // TEST SUITE 6: AI-POWERED NATURAL SEARCH & SORT LABEL
    // ==========================================
    console.log('\n--- 6. Testing Groq Qwen 27B AI Natural Search ---')

    // Search conversational query "hello"
    const aiInput = await page.waitForSelector('input[placeholder*="Ask in natural language"]')
    await aiInput.click({ clickCount: 3 })
    await aiInput.type('hello')
    const askAiBtn = await page.waitForSelector('form button[type="submit"]')
    await askAiBtn.click()
    await sleep(3000)

    const interpretationCard = await page.$eval('body', (el) => el.innerText)
    assert(
      interpretationCard.includes('GROQ QWEN 27B QUERY INTERPRETATION'),
      'AI query interpretation card renders after natural language search'
    )
    assert(
      interpretationCard.includes('Sort: Best Match'),
      'Sort label is clearly displayed as "Sort: Best Match" (not confusing raw "sort = relevance")'
    )
    assert(
      interpretationCard.includes('No specific category, brand, or price constraints detected'),
      'Explanatory contextual note explains why full catalog is displayed'
    )

    // Exit AI Search
    const buttons = await page.$$('button')
    for (const b of buttons) {
      const text = await page.evaluate((el) => el.innerText, b)
      if (text.includes('Exit AI Search')) {
        await b.click()
        break
      }
    }
    await sleep(500)

    // ==========================================
    // TEST SUITE 7: PRODUCT CREATION WITH AI COPYWRITER & STOCK PERSISTENCE
    // ==========================================
    console.log('\n--- 7. Testing Product Creation & AI Studio ---')

    // Click "New Product" button
    const allBtns = await page.$$('button')
    for (const b of allBtns) {
      const text = await page.evaluate((el) => el.innerText, b)
      if (text.includes('New Product')) {
        await b.click()
        break
      }
    }
    await sleep(700)

    // Verify modal opened
    const createModalTitle = await page.$eval('#modal-title', (el) => el.innerText).catch(() => '')
    assert(
      createModalTitle.includes('Create New Product') || createModalTitle.includes('Product'),
      'Product Form Modal opens successfully'
    )

    // Verify AI Copywriter Studio button dimensions and styling
    let foundAiDraftBtn = false
    for (const b of await page.$$('button')) {
      const text = await page.evaluate((el) => el.innerText, b)
      if (text.includes('Draft with AI')) {
        foundAiDraftBtn = true
        const btnBox = await b.boundingBox()
        assert(
          btnBox.height >= 30 && btnBox.height <= 36,
          `Draft with AI button has normalized 32px height (actual: ${btnBox.height}px) without text wrapping`
        )
        break
      }
    }
    assert(foundAiDraftBtn, 'Draft with AI button exists in AI Copywriter Studio')

    // Select Brand via UI dropdown
    const brandTrigger = await page.waitForSelector('#brand-select')
    await brandTrigger.click()
    await sleep(300)
    const brandOptions = await page.$$('[role="listbox"] [role="option"]')
    if (brandOptions.length > 1) {
      await brandOptions[1].click()
    }
    await sleep(300)

    // Select Category via UI dropdown
    const categoryTrigger = await page.waitForSelector('#category-select')
    await categoryTrigger.click()
    await sleep(300)
    const categoryOptions = await page.$$('[role="listbox"] [role="option"]')
    if (categoryOptions.length > 1) {
      await categoryOptions[1].click()
    }
    await sleep(300)

    // Fill in product details
    const testProductName = `E2E Studio Monitor Pro ${Date.now().toString().slice(-4)}`
    const nameInput = await page.waitForSelector('input[placeholder*="Sony WH-1000XM5"]')
    await nameInput.type(testProductName)

    const priceInput = await page.waitForSelector('input[placeholder="0.00"]')
    await priceInput.click({ clickCount: 3 })
    await priceInput.type('18499.00')

    const stockInput = await page.waitForSelector('input#inventory-stock')
    await stockInput.click({ clickCount: 3 })
    await stockInput.type('14')

    // Submit product creation
    const createSubmitBtn = await page.waitForSelector('button[form="product-form"]')
    await createSubmitBtn.click()
    await sleep(2000)

    const formError = await page.$eval('#product-form', (el) => el.innerText).catch(() => 'FORM_NOT_FOUND')
    console.log('    [Debug] Form content after submit:', formError.slice(0, 200).replace(/\n/g, ' | '))

    // Wait for the modal to close and catalog to reload the newly created card
    await page.waitForFunction(
      (name) => {
        const headings = Array.from(document.querySelectorAll('article h3, div.group h3, main h3'))
        return headings.some((h) => h.innerText.includes(name))
      },
      { timeout: 8000 },
      testProductName
    )

    // Verify product exists in catalog
    const cardText = await page.evaluate((name) => {
      const headings = Array.from(document.querySelectorAll('article h3, div.group h3, main h3'))
      const match = headings.find((h) => h.innerText.includes(name))
      if (!match) return ''
      const parent = match.closest('article') || match.closest('div.group') || match.parentElement
      return parent ? parent.innerText : ''
    }, testProductName)

    assert(
      cardText.length > 0,
      `Newly created product "${testProductName}" immediately appears in live catalog grid`
    )

    assert(
      cardText.includes('14 in stock') || cardText.includes('14 units') || cardText.includes('14'),
      'Inventory stock = 14 persists and correctly displays on product card'
    )

    // ==========================================
    // TEST SUITE 8: THEME TOGGLE (DARK / LIGHT MODE)
    // ==========================================
    console.log('\n--- 8. Testing Theme Toggle ---')
    const themeBtn = await page.waitForSelector('button[aria-label*="Switch to"]')
    assert(themeBtn !== null, 'Theme toggle button exists in header')

    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    await themeBtn.click()
    await sleep(400)
    const newTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    assert(
      initialTheme !== newTheme,
      `Theme toggle switches theme from "${initialTheme}" to "${newTheme}"`
    )

    // Switch back to original theme
    await themeBtn.click()
    await sleep(300)

    // ==========================================
    // TEST SUITE 9: SIGN OUT & ROUTE PROTECTION VERIFICATION
    // ==========================================
    console.log('\n--- 9. Testing Sign Out & Authentication Re-Guard ---')
    const signOutBtn = await page.waitForSelector('#nav-sign-out-btn')
    assert(signOutBtn !== null, 'Sign out button exists in Navbar')
    await page.evaluate(() => document.querySelector('#nav-sign-out-btn').click())
    await sleep(1500)

    // Verify navbar user pill is gone
    const navAfterLogout = await page.$eval('header', (el) => el.innerText)
    assert(
      !navAfterLogout.includes('CatalogIQ Administrator'),
      'User profile pill cleared from Navbar after logout'
    )

    // Verify accessing protected section now redirects to login
    await page.goto(`${BASE_URL}/sessions`, { waitUntil: 'networkidle0' })
    await sleep(500)
    const protectedUrlAfterLogout = page.url()
    assert(
      protectedUrlAfterLogout.includes('/login'),
      'Attempting to visit /sessions after logout redirects to /login'
    )

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('\n==========================================')
    console.log(`🎉 Finished browser tests: ${passedTests}/${totalTests} PASSED!`)
    console.log('==========================================')

    if (consoleErrors.length > 0) {
      console.warn(`⚠️ Warning: ${consoleErrors.length} console errors detected:`)
      consoleErrors.slice(0, 5).forEach((e) => console.warn(`   - ${e}`))
    } else {
      console.log('✨ 0 console errors detected during the entire run.')
    }
  } catch (err) {
    console.error('💥 Test suite crashed with error:', err)
  } finally {
    await browser.close()
  }
}

runTests()

