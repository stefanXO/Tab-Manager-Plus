# <sub><img src="images/browsers64.png" width="64px" height="64px"></sub> Tab Manager Plus <!-- VERSION -->7.0.0<!-- /VERSION -->

##### Search through your tabs instantly, save windows for later, limit open tabs per window - and many more.

This is an extended version of the old Tab Manager Google Chrome extension. Should work on both Chrome and Firefox. Malware free, with a new view type and many new features.

[<img src="images/webstore.png" alt="Tab Manager Plus for Chrome">](
https://chrome.google.com/webstore/detail/tab-manager-plus-for-chro/cnkdjjdmfiffagllbiiilooaoofcoeff) [<img src="images/get-the-addon.png" align="left" alt="Tab Manager Plus for Firefox">](https://addons.mozilla.org/en-US/firefox/addon/tab-manager-plus-for-firefox/)

## Donations

A lot of work went into this extension for free. Many user requests have been integrated with countless of hours spent into coding, refining and testing of the extension. The extension stays free and is open source - so you can copy it and alter it in any way you want. If you love it, please become a [patreon patron](https://www.patreon.com/bePatron?u=26287710), or [donate to support this extension](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=67TZLSEGYQFFW).

Receiving continuous donations really helps me in investing time into all the different extensions, and making sure that they are not neglected, nor that future browser updates keep them from working correctly. It also allows me to make them backwards compatible, for people on older systems. And of course it helps me in taking the time and brain power needed for developing new features and solving your issues for a long time.

Your patronage means that my work was able to help you - and that's already very encouraging for me to continue. Thank you <3

[<img src="images/patron.png" alt="Become a Patron!">](https://www.patreon.com/bePatron?u=26287710)

[<img src="images/paypal.jpg" alt="Donate to keep extensions alive">](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=67TZLSEGYQFFW)
[<img src="images/donate.gif" alt="Donate to keep extensions alive">](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=67TZLSEGYQFFW)

## Building from source

The extension is written in TypeScript and bundled with esbuild into `dist/`, which is not part of the repository. You need [Node.js](https://nodejs.org/) 22.18 or newer (24 recommended; the tests run the TypeScript sources directly, which older versions cannot).

```
git clone https://github.com/stefanXO/Tab-Manager-Plus.git
cd Tab-Manager-Plus
npm ci
npm run build
```

Then load the folder as an unpacked extension:

* **Chrome / Edge / Brave:** open `chrome://extensions`, turn on *Developer mode*, click *Load unpacked* and pick the repository folder.
* **Firefox:** the 7.x Firefox build is not ready yet; the current Firefox release is built from the `firefox_521` branch.

Useful scripts:

* `npm run watch` rebuilds on every change (`npm run watch:dev` for an unminified build with source maps). After a rebuild, click *Reload* on the extension card.
* `npm run build:dev` builds once without minification.
* `npm run check-version` verifies that the version number is the same in every file; `npm version <x.y.z>` bumps it everywhere.

## Other Notes

You can find and install this extension at the [Chrome Web Store](https://chrome.google.com/webstore/detail/tab-manager-plus-for-chro/cnkdjjdmfiffagllbiiilooaoofcoeff) or the [Firefox Add-Ons](https://addons.mozilla.org/en-US/firefox/addon/tab-manager-plus-for-firefox/).

* For a list of changes check out the [changelog](./CHANGELOG.md).
* [Latest Reddit threads](https://www.reddit.com/search/?q=Tab%20Manager%20Plus)
* [Open Issues](https://github.com/stefanXO/Tab-Manager-Plus/issues)
* [Submit a new issue](https://github.com/stefanXO/Tab-Manager-Plus/issues/new)


Please enjoy.

## License
MPLv2

## Privacy Policy
[We do not track any of your data, period.](./PRIVACY.md)