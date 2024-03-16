import { Page } from 'puppeteer';
import selectors from '../selectors';
import fs from 'fs'; // Node.js file system module for saving the file

function getCurrentDateTime(): string {
  const now = new Date();

  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
  const day = now.getDate().toString().padStart(2, '0');
  
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');

  return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
}

async function clickSeeMoreButton(page: Page): Promise<void> {
  await page.waitForSelector(selectors.seeMoreButtonSelector, { timeout: 10000 });
  await page.hover(selectors.seeMoreButtonSelector);
  await page.evaluate((selector: string) => {
    const button = document.querySelector(selector) as HTMLButtonElement;
    if (button) {
      button.click();
    } else {
      throw new Error(`See More Button not found.`);
    }
  }, selectors.seeMoreButtonSelector);
}
export async function saveJobDescriptionText(link: string, title: string, companyName: string, page: Page): Promise<string> {
  await page.goto(link, { waitUntil: 'load', timeout: 60000 });

  try {
    await clickSeeMoreButton(page);
  } catch (error) {
    throw new Error(`Easy apply button not found in posting: ${link}. Error: ${error}`);
  }

  const jobDescriptionHandle = await page.$(selectors.jobPageDescription);
  if (!jobDescriptionHandle) {
    throw new Error('Job description element not found');
  }
  try {
    // Extracting texts of all <p> tags within the jobDescription element
    // const jobDescriptionTexts = await jobDescriptionHandle.$$eval('p', (paragraphs: any) => paragraphs.map((p: any) => p.textContent.trim()));

    // just extracting raw contents for now
    const jobDescriptionHTML = await jobDescriptionHandle.evaluate(node => node.outerHTML);
    
    const jobDetails = {
      title: title,
      link: link,
      company: companyName?.trim(),
      // description: jobDescriptionTexts
      description: jobDescriptionHTML
    };

    // File name format "<companyName>_<jobTitle>.json"
    // Replace any spaces with underscores and remove special characters for file naming
    const datetime = getCurrentDateTime();
    const fileName = `jobs/${datetime}_${companyName?.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}_${title.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}.json`;

    fs.writeFileSync(fileName, JSON.stringify(jobDetails, null, 2));

    return `Successfully saved as ${fileName}`;
  } catch (error) {
    throw new Error('Unable to get job description text');
  }
}