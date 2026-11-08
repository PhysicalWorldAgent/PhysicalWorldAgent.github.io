# When the World Is the Test Suite: Agentic Intelligence for the Physical World

Project website: **https://PhysicalWorldAgent.github.io/**

- Organization: https://github.com/PhysicalWorldAgent
- Main project repository: https://github.com/PhysicalWorldAgent/Awesome-PhysicalWorldAgent
- Website hosting repository: https://github.com/PhysicalWorldAgent/PhysicalWorldAgent.github.io

Project resources belong in `Awesome-PhysicalWorldAgent`. This repository hosts the organization's root website and therefore uses the GitHub Pages name `PhysicalWorldAgent.github.io`.

## Layout

```
index.html          page text and structure
site/styles.css     design: a painted yellow ground, oil-stick lettering, typewritten notes
site/art.js         the hero painting (drawn from a seeded random source), reveals, BibTeX copy
assets/figures/     the paper's thirteen figures, cropped from the compiled PDF
assets/teaser.webp  the opening illustration without labels (social preview)
assets/art/*.webp   illustrations from the paper, used with the loop and the key numbers
favicon.svg         the robot head
```

The text on the page is taken from the paper: the abstract, the research questions, and the numbers on the findings cards. All motion respects the reader's reduced-motion setting.

## Website updates

GitHub Pages publishes the root directory of the `main` branch. Edit the files and push to `main` to update the website; bump the `?v=` query on `site/styles.css` and `site/art.js` in `index.html` so browsers fetch the new versions. `.nojekyll` keeps the site as plain static files.
