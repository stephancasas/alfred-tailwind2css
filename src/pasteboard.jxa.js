#!/usr/bin/env osascript -l JavaScript

function run([argv = '']) {
  const App = Application.currentApplication();
  App.includeStandardAdditions = true;

  if (!argv) return;

  App.setTheClipboardTo(argv);
  App.doShellScript(`afplay /System/Library/Sounds/Funk.aiff`);
}
