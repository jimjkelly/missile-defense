Missle Defense
--------------

This project implements Scott LaFoy's specification for
an online calculator to display probabilities of a
missile strike given various defense systems.

This repository contains the code necessary for
development. To see the project, please visit it
on the web at ...

Development
===========

Getting started on development requires a UNIX-like
operating system. Assuming OS X, the following
should be sufficient:

- Install yarn: `brew install yarn`
- In the root of this repository: `yarn`
- Start the development server: `npm run dev`

This will start a server at `localhost:9090`. Editing the
files in `src` will automatically update the release
files, which can be found in `dist`.

To build for a release, `npm run build`. It's suggested
that you run `npm run test` and `npm run lint` before
any release.
