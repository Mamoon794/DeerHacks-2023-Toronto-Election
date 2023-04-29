import puppeteer from "puppeteer";

export async function scrapeWebsite(website, classSelector) {
    const browser = await puppeteer.launch({headless: 'new'});
    const page = await browser.newPage();
    await page.goto(website);
    // await page.screenshot({ path: "website.png", fullPage: true });
    let reviews = await page.evaluate((classSelector) => {
        return Array.from(document.querySelectorAll(classSelector)).map(x => x.textContent)
    }, classSelector);
    await browser.close();
    return reviews;
}

