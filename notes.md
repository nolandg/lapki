bundle.js size:
- Nov 21 dev mode before optimization attempts: 2.9M
  - 1835: prod mod 849.57kb


Dec 13. noland-test site:
  - bundle.js = 1.3MB gzipped
  - 6.6MB of images
  - all scripts from my domain = 1.4MB
  - PSI scores: 61 desktop, 14 mobile

  after update:
  - bundle.js = 873kb
  - PSI scores: 69 desktop, 40 mobile

  after images became reasonable sizes:
  - 3.1MB of images for widescreen, 1.3MB for mobile
  - PSI scores: 89-98 for desktop, 27-60 mobile
