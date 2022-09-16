#!/usr/bin/env osascript -l JavaScript

function run([query = 'flex items-center pl-[1px]']) {
    const BUNDLE_ID = 'com.stephancasas.AlfredTailwind2CSS';
  
    const App = Application.currentApplication();
    App.includeStandardAdditions = true;
  
    /**
     * Does a path exist and, if so, what's there?
     * @param path The path to test.
     * @returns boolean
     */
    const pathType = (path) => {
      ObjC.import('Foundation');
      let isDir = Ref();
      $.NSFileManager.alloc.init.fileExistsAtPathIsDirectory(
        Path(path).toString(),
        isDir,
      );
      if (isDir[0]) return 'directory';
  
      return $.NSFileManager.alloc.init.fileExistsAtPath(Path(path).toString())
        ? 'file'
        : false;
    };
  
    const $path = (...segments) => segments.join('/').replace(/\s/g, '\\ ');
    const PWD = $path(
      App.systemAttribute('alfred_preferences'),
      'workflows',
      App.systemAttribute('alfred_workflow_uid'),
    );
  
    const CACHE_DIR = (() => {
      const cache = App.systemAttribute('alfred_workflow_data');
      const dir = !!cache.match(new RegExp(BUNDLE_ID.replace(/\./g, '\\.'), 'gi'))
        ? cache
        : `${App.systemAttribute(
            'HOME',
          )}/Library/Application Support/Alfred/Workflow Data/${BUNDLE_ID}`;
      App.doShellScript(`mkdir -p '${dir}';`);
      return dir;
    })();
  
    const CHEATSHEET_URL = `https://raw.githubusercontent.com/Devzstudio/tailwind_to_css/main/cheatsheet.ts`;
  
    const CheatSheet = (() => {
      const store = `${CACHE_DIR}/cheatsheet.ts`;
      const src = pathType(store)
        ? App.doShellScript(`curl -S 'file://${store.replace(/\s/g, '%20')}'`)
        : App.doShellScript(
            `curl -S ${CHEATSHEET_URL} > "${CACHE_DIR}/cheatsheet.ts"`,
          ) &&
          App.doShellScript(`curl -S 'file://${store.replace(/\s/g, '%20')}'`);
  
      return eval(
        `() => {${src.replace(/^export.*$/gm, '')} return CheatSheet;}`,
      )();
    })();
  
    /**
     * ---------------------------------------------------------------------------
     * Region: Adapted from Devzstudio/tailwind_to_css
     * ---------------------------------------------------------------------------
     *
     * Code below this flag was adapted from GitHub repository
     * https://github.com/Devzstudio/tailwind_to_css
     *
     * Changes have been applied for compatibility with JXA.
     */
  
    const arbitrarySupportedClasses = {
      pt: 'padding-top',
      pb: 'padding-bottom',
      pl: 'padding-left',
      pr: 'padding-right',
      p: 'padding',
      mb: 'margin-bottom',
      m: 'margin',
      mt: 'margin-top',
      ml: 'margin-left',
      mr: 'margin-right',
      w: 'width',
      h: 'height',
      top: 'top',
      bottom: 'bottom',
      left: 'left',
      right: 'right',
      bg: 'background',
      text: 'color',
    };
  
    const convertToCss = (classNames) => {
      let cssCode = ``;
      CheatSheet.forEach((element) => {
        element.content.forEach((content) => {
          content.table.forEach((list) => {
            if (classNames.includes(list[0])) {
              const semicolon = list[1][list[1].length - 1] !== ';' ? ';' : '';
              if (list.length === 3) cssCode += `${list[1]}${semicolon} \n`;
              else cssCode += `${list[2]}${semicolon} \n`;
            }
  
            if (classNames.includes(list[1])) {
              const semicolon = list[2][list[2].length - 1] !== ';' ? ';' : '';
              cssCode += `${list[2]}${semicolon} \n`;
            }
          });
        });
      });
  
      // Check for arbitrary values
  
      const arbitraryClasses = classNames.filter((className) =>
        className.includes('['),
      );
  
      arbitraryClasses.forEach((className) => {
        const property = className.split('-[')[0].replace('.', '');
  
        // use perl -- jxa does not support lookbehind/lookahead
        // const propertyValue = className.match(/(?<=\[)[^\][]*(?=])/g)[0];
        const propertyValue = App.doShellScript(
          `printf "${className}" | perl -ne '/(?<=\\[)(?<prop>[^\\][]*)(?=])/ && print "$+{prop}"'`,
        );
        if (arbitrarySupportedClasses[property]) {
          cssCode += `${arbitrarySupportedClasses[property]}: ${propertyValue};\n`;
        }
      });
  
      return cssCode;
    };
  
    const getBreakPoints = (input, breakpoint) => {
      return input
        .split(' ')
        .filter((i) => i.startsWith(breakpoint + ':'))
        .map((i) => '.' + i.substring(3));
    };
  
    const getHoverClass = (input) => {
      return input
        .split(' ')
        .filter((i) => i.startsWith('hover:'))
        .map((i) => i.replace('hover:', '.'));
    };
  
    const getConvertedClasses = (input) => {
      const classNames = input.split(/\s+/).map((i) => '.' + i.trim());
      const breakpoints = CheatSheet[0].content[3].table;
  
      const hoverClasses = getHoverClass(input);
  
      const smClasses = getBreakPoints(input, 'sm');
      const mdClasses = getBreakPoints(input, 'md');
      const lgClasses = getBreakPoints(input, 'lg');
      const xlClasses = getBreakPoints(input, 'xl');
      const _2xlClasses = getBreakPoints(input, '2xl');
  
      let resultCss = `${convertToCss(classNames)}
  ${
    smClasses.length !== 0
      ? breakpoints[0][1].replace('...', '\n  ' + convertToCss(smClasses))
      : ''
  }
  ${
    mdClasses.length !== 0
      ? breakpoints[1][1].replace('...', '\n  ' + convertToCss(mdClasses))
      : ''
  }
  ${
    lgClasses.length !== 0
      ? breakpoints[2][1].replace('...', '\n  ' + convertToCss(lgClasses))
      : ''
  }
  ${
    xlClasses.length !== 0
      ? breakpoints[3][1].replace('...', '\n  ' + convertToCss(xlClasses))
      : ''
  }
  ${
    _2xlClasses.length !== 0
      ? breakpoints[4][1].replace('...', '\n  ' + convertToCss(_2xlClasses))
      : ''
  }
  ${hoverClasses.length !== 0 ? `:hover {\n ${convertToCss(hoverClasses)} }` : ''}
  `;
  
      return resultCss;
    };
  
    // ----------------------- RegionEnd: Adapted Code ------------------------ //
  
    const result = getConvertedClasses(query).replace(/\n*$/, '');
    if (!result)
      return JSON.stringify({
        items: [
          {
            title: 'No matches. Keep typing...',
            valid: false,
            icon: {
              path: `${PWD}/ellipsis.png`,
            },
          },
        ],
      });
  
    const html = `style="${result.replace(/\n/g, '')}"`;
  
    return JSON.stringify({
      items: [
        {
          title: 'Copy as CSS',
          subtitle: result.replace(/\n/g, ''),
          arg: result,
          icon: {
            path: `${PWD}/css3-alt.png`,
          },
          valid: true,
        },
        {
          title: 'Copy as HTML Attribute',
          subtitle: html,
          arg: html,
          icon: {
            path: `${PWD}/html5.png`,
          },
          valid: true,
        },
      ],
    });
  }
  