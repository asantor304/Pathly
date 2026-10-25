# Pathly — clickable prototype website

A standalone version of the Pathly prototype. It's plain HTML, CSS and JavaScript, with no install or build step.

## What's inside

| File | Screen |
|---|---|
| `index.html` | Marketing website for schools (start here) |
| `signin.html` | Sign-in and 3-question onboarding |
| `student.html` | Student dashboard |
| `counselor.html` | Counselor dashboard |
| `essay.html` | Essay feedback and approval |
| `recommendations.html` | Teacher recommendation requests (student and teacher views) |
| `aid-compare.html` | Financial aid offer comparison |
| `resources.html` | Resource library with 10 guides |
| `runtime.js` | Small script that draws every page and makes the buttons work |

All students, essays and aid amounts are sample data for demonstration.

## Option A — open it on your computer

1. Unzip the folder.
2. Double-click `index.html`. It opens in your browser.

The fonts load from Google Fonts, so they look best with internet. Without it, the pages still work with a fallback font.

## Option B — put it online with Netlify (easiest, about 2 minutes)

1. Go to **app.netlify.com/drop** and create a free account.
2. Drag the whole unzipped `pathly-site` folder onto the page.
3. You get a live link right away. Under **Site configuration → Change site name**, rename it to something like `pathly-capstone`, which gives you `pathly-capstone.netlify.app`.

To update it later, drag the folder in again from the site's **Deploys** tab.

## Option C — put it online with GitHub Pages (good for a team)

1. Create a free account at **github.com** and click **New repository**. Name it `pathly`, set it to **Public**, and create it.
2. Click **uploading an existing file**, drag in everything *inside* the `pathly-site` folder (not the folder itself), and click **Commit changes**.
3. Go to **Settings → Pages**. Under *Build and deployment*, choose **Deploy from a branch**, pick `main` and `/ (root)`, and click **Save**.
4. After a minute or two, your site is live at `https://<your-username>.github.io/pathly/`.

Teammates you add as collaborators can edit files right on GitHub.

## Editing

- **Text:** open any `.html` file in a text editor such as VS Code and change the words between the tags.
- **Sample data** (students, deadlines, colleges, guides, aid offers): it lives in the `class Component` block at the bottom of each page, inside `renderVals()`.
- **School color:** in `student.html` and `counselor.html`, change `"default":"#7A1F2B"` in the `dc-props` line.
- **How pages work:** each page's markup sits in the `dc-template` block. `{{ name }}` inserts a value, `<sc-for>` repeats a block for each item in a list, and `<sc-if>` shows a block only when a value is true. `runtime.js` turns that into the page you see.
