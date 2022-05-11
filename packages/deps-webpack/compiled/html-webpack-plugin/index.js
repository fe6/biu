/******/ (function() { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 486:
/***/ (function(module, __unused_webpack_exports, __nccwpck_require__) {

"use strict";
// @ts-check
// Import types
/** @typedef {import("./typings").HtmlTagObject} HtmlTagObject */
/** @typedef {import("./typings").Options} HtmlWebpackOptions */
/** @typedef {import("./typings").ProcessedOptions} ProcessedHtmlWebpackOptions */
/** @typedef {import("./typings").TemplateParameter} TemplateParameter */
/** @typedef {import("webpack/lib/Compiler.js")} WebpackCompiler */
/** @typedef {import("webpack/lib/Compilation.js")} WebpackCompilation */


const promisify = (__nccwpck_require__(837).promisify);

const vm = __nccwpck_require__(144);
const fs = __nccwpck_require__(147);
const _ = __nccwpck_require__(829);
const path = __nccwpck_require__(17);
const { CachedChildCompilation } = __nccwpck_require__(629);

const { createHtmlTagObject, htmlTagObjectToString, HtmlTagArray } = __nccwpck_require__(919);

const prettyError = __nccwpck_require__(36);
const chunkSorter = __nccwpck_require__(328);
const getHtmlWebpackPluginHooks = (__nccwpck_require__(380).getHtmlWebpackPluginHooks);
const { assert } = __nccwpck_require__(206);

const fsReadFileAsync = promisify(fs.readFile);

class HtmlWebpackPlugin {
  /**
   * @param {HtmlWebpackOptions} [options]
   */
  constructor (options) {
    /** @type {HtmlWebpackOptions} */
    this.userOptions = options || {};
    this.version = HtmlWebpackPlugin.version;
  }

  apply (compiler) {
    // Wait for configuration preset plugions to apply all configure webpack defaults
    compiler.hooks.initialize.tap('HtmlWebpackPlugin', () => {
      const userOptions = this.userOptions;

      // Default options
      /** @type {ProcessedHtmlWebpackOptions} */
      const defaultOptions = {
        template: 'auto',
        templateContent: false,
        templateParameters: templateParametersGenerator,
        filename: 'index.html',
        publicPath: userOptions.publicPath === undefined ? 'auto' : userOptions.publicPath,
        hash: false,
        inject: userOptions.scriptLoading === 'blocking' ? 'body' : 'head',
        scriptLoading: 'defer',
        compile: true,
        favicon: false,
        minify: 'auto',
        cache: true,
        showErrors: true,
        chunks: 'all',
        excludeChunks: [],
        chunksSortMode: 'auto',
        meta: {},
        base: false,
        title: 'Webpack App',
        xhtml: false
      };

      /** @type {ProcessedHtmlWebpackOptions} */
      const options = Object.assign(defaultOptions, userOptions);
      this.options = options;

      // Assert correct option spelling
      assert(options.scriptLoading === 'defer' || options.scriptLoading === 'blocking' || options.scriptLoading === 'module', 'scriptLoading needs to be set to "defer", "blocking" or "module"');
      assert(options.inject === true || options.inject === false || options.inject === 'head' || options.inject === 'body', 'inject needs to be set to true, false, "head" or "body');

      // Default metaOptions if no template is provided
      if (!userOptions.template && options.templateContent === false && options.meta) {
        const defaultMeta = {
        // From https://developer.mozilla.org/en-US/docs/Mozilla/Mobile/Viewport_meta_tag
          viewport: 'width=device-width, initial-scale=1'
        };
        options.meta = Object.assign({}, options.meta, defaultMeta, userOptions.meta);
      }

      // entryName to fileName conversion function
      const userOptionFilename = userOptions.filename || defaultOptions.filename;
      const filenameFunction = typeof userOptionFilename === 'function'
        ? userOptionFilename
        // Replace '[name]' with entry name
        : (entryName) => userOptionFilename.replace(/\[name\]/g, entryName);

      /** output filenames for the given entry names */
      const entryNames = Object.keys(compiler.options.entry);
      const outputFileNames = new Set((entryNames.length ? entryNames : ['main']).map(filenameFunction));

      /** Option for every entry point */
      const entryOptions = Array.from(outputFileNames).map((filename) => ({
        ...options,
        filename
      }));

      // Hook all options into the webpack compiler
      entryOptions.forEach((instanceOptions) => {
        hookIntoCompiler(compiler, instanceOptions, this);
      });
    });
  }

  /**
   * Once webpack is done with compiling the template into a NodeJS code this function
   * evaluates it to generate the html result
   *
   * The evaluateCompilationResult is only a class function to allow spying during testing.
   * Please change that in a further refactoring
   *
   * @param {string} source
   * @param {string} templateFilename
   * @returns {Promise<string | (() => string | Promise<string>)>}
   */
  evaluateCompilationResult (source, publicPath, templateFilename) {
    if (!source) {
      return Promise.reject(new Error('The child compilation didn\'t provide a result'));
    }
    // The LibraryTemplatePlugin stores the template result in a local variable.
    // By adding it to the end the value gets extracted during evaluation
    if (source.indexOf('HTML_WEBPACK_PLUGIN_RESULT') >= 0) {
      source += ';\nHTML_WEBPACK_PLUGIN_RESULT';
    }
    const templateWithoutLoaders = templateFilename.replace(/^.+!/, '').replace(/\?.+$/, '');
    const vmContext = vm.createContext({
      ...global,
      HTML_WEBPACK_PLUGIN: true,
      require: require,
      htmlWebpackPluginPublicPath: publicPath,
      URL: (__nccwpck_require__(310).URL),
      __filename: templateWithoutLoaders
    });
    const vmScript = new vm.Script(source, { filename: templateWithoutLoaders });
    // Evaluate code and cast to string
    let newSource;
    try {
      newSource = vmScript.runInContext(vmContext);
    } catch (e) {
      return Promise.reject(e);
    }
    if (typeof newSource === 'object' && newSource.__esModule && newSource.default) {
      newSource = newSource.default;
    }
    return typeof newSource === 'string' || typeof newSource === 'function'
      ? Promise.resolve(newSource)
      : Promise.reject(new Error('The loader "' + templateWithoutLoaders + '" didn\'t return html.'));
  }
}

/**
 * connect the html-webpack-plugin to the webpack compiler lifecycle hooks
 *
 * @param {import('webpack').Compiler} compiler
 * @param {ProcessedHtmlWebpackOptions} options
 * @param {HtmlWebpackPlugin} plugin
 */
function hookIntoCompiler (compiler, options, plugin) {
  const webpack = compiler.webpack;
  // Instance variables to keep caching information
  // for multiple builds
  let assetJson;
  /**
   * store the previous generated asset to emit them even if the content did not change
   * to support watch mode for third party plugins like the clean-webpack-plugin or the compression plugin
   * @type {Array<{html: string, name: string}>}
   */
  let previousEmittedAssets = [];

  options.template = getFullTemplatePath(options.template, compiler.context);

  // Inject child compiler plugin
  const childCompilerPlugin = new CachedChildCompilation(compiler);
  if (!options.templateContent) {
    childCompilerPlugin.addEntry(options.template);
  }

  // convert absolute filename into relative so that webpack can
  // generate it at correct location
  const filename = options.filename;
  if (path.resolve(filename) === path.normalize(filename)) {
    const outputPath = /** @type {string} - Once initialized the path is always a string */(compiler.options.output.path);
    options.filename = path.relative(outputPath, filename);
  }

  // Check if webpack is running in production mode
  // @see https://github.com/webpack/webpack/blob/3366421f1784c449f415cda5930a8e445086f688/lib/WebpackOptionsDefaulter.js#L12-L14
  const isProductionLikeMode = compiler.options.mode === 'production' || !compiler.options.mode;

  const minify = options.minify;
  if (minify === true || (minify === 'auto' && isProductionLikeMode)) {
    /** @type { import('html-minifier-terser').Options } */
    options.minify = {
      // https://www.npmjs.com/package/html-minifier-terser#options-quick-reference
      collapseWhitespace: true,
      keepClosingSlash: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      useShortDoctype: true
    };
  }

  compiler.hooks.thisCompilation.tap('HtmlWebpackPlugin',
    /**
       * Hook into the webpack compilation
       * @param {WebpackCompilation} compilation
      */
    (compilation) => {
      compilation.hooks.processAssets.tapAsync(
        {
          name: 'HtmlWebpackPlugin',
          stage:
          /**
           * Generate the html after minification and dev tooling is done
           */
          webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE
        },
        /**
         * Hook into the process assets hook
         * @param {WebpackCompilation} compilationAssets
         * @param {(err?: Error) => void} callback
         */
        (compilationAssets, callback) => {
          // Get all entry point names for this html file
          const entryNames = Array.from(compilation.entrypoints.keys());
          const filteredEntryNames = filterChunks(entryNames, options.chunks, options.excludeChunks);
          const sortedEntryNames = sortEntryChunks(filteredEntryNames, options.chunksSortMode, compilation);

          const templateResult = options.templateContent
            ? { mainCompilationHash: compilation.hash }
            : childCompilerPlugin.getCompilationEntryResult(options.template);

          if ('error' in templateResult) {
            compilation.errors.push(prettyError(templateResult.error, compiler.context).toString());
          }

          // If the child compilation was not executed during a previous main compile run
          // it is a cached result
          const isCompilationCached = templateResult.mainCompilationHash !== compilation.hash;

          /** The public path used inside the html file */
          const htmlPublicPath = getPublicPath(compilation, options.filename, options.publicPath);

          /** Generated file paths from the entry point names */
          const assets = htmlWebpackPluginAssets(compilation, sortedEntryNames, htmlPublicPath);

          // If the template and the assets did not change we don't have to emit the html
          const newAssetJson = JSON.stringify(getAssetFiles(assets));
          if (isCompilationCached && options.cache && assetJson === newAssetJson) {
            previousEmittedAssets.forEach(({ name, html }) => {
              compilation.emitAsset(name, new webpack.sources.RawSource(html, false));
            });
            return callback();
          } else {
            previousEmittedAssets = [];
            assetJson = newAssetJson;
          }

          // The html-webpack plugin uses a object representation for the html-tags which will be injected
          // to allow altering them more easily
          // Just before they are converted a third-party-plugin author might change the order and content
          const assetsPromise = getFaviconPublicPath(options.favicon, compilation, assets.publicPath)
            .then((faviconPath) => {
              assets.favicon = faviconPath;
              return getHtmlWebpackPluginHooks(compilation).beforeAssetTagGeneration.promise({
                assets: assets,
                outputName: options.filename,
                plugin: plugin
              });
            });

          // Turn the js and css paths into grouped HtmlTagObjects
          const assetTagGroupsPromise = assetsPromise
          // And allow third-party-plugin authors to reorder and change the assetTags before they are grouped
            .then(({ assets }) => getHtmlWebpackPluginHooks(compilation).alterAssetTags.promise({
              assetTags: {
                scripts: generatedScriptTags(assets.js),
                styles: generateStyleTags(assets.css),
                meta: [
                  ...generateBaseTag(options.base),
                  ...generatedMetaTags(options.meta),
                  ...generateFaviconTags(assets.favicon)
                ]
              },
              outputName: options.filename,
              publicPath: htmlPublicPath,
              plugin: plugin
            }))
            .then(({ assetTags }) => {
              // Inject scripts to body unless it set explicitly to head
              const scriptTarget = options.inject === 'head' ||
                (options.inject !== 'body' && options.scriptLoading !== 'blocking') ? 'head' : 'body';
              // Group assets to `head` and `body` tag arrays
              const assetGroups = generateAssetGroups(assetTags, scriptTarget);
              // Allow third-party-plugin authors to reorder and change the assetTags once they are grouped
              return getHtmlWebpackPluginHooks(compilation).alterAssetTagGroups.promise({
                headTags: assetGroups.headTags,
                bodyTags: assetGroups.bodyTags,
                outputName: options.filename,
                publicPath: htmlPublicPath,
                plugin: plugin
              });
            });

          // Turn the compiled template into a nodejs function or into a nodejs string
          const templateEvaluationPromise = Promise.resolve()
            .then(() => {
              if ('error' in templateResult) {
                return options.showErrors ? prettyError(templateResult.error, compiler.context).toHtml() : 'ERROR';
              }
              // Allow to use a custom function / string instead
              if (options.templateContent !== false) {
                return options.templateContent;
              }
              // Once everything is compiled evaluate the html factory
              // and replace it with its content
              return ('compiledEntry' in templateResult)
                ? plugin.evaluateCompilationResult(templateResult.compiledEntry.content, htmlPublicPath, options.template)
                : Promise.reject(new Error('Child compilation contained no compiledEntry'));
            });
          const templateExectutionPromise = Promise.all([assetsPromise, assetTagGroupsPromise, templateEvaluationPromise])
          // Execute the template
            .then(([assetsHookResult, assetTags, compilationResult]) => typeof compilationResult !== 'function'
              ? compilationResult
              : executeTemplate(compilationResult, assetsHookResult.assets, { headTags: assetTags.headTags, bodyTags: assetTags.bodyTags }, compilation));

          const injectedHtmlPromise = Promise.all([assetTagGroupsPromise, templateExectutionPromise])
          // Allow plugins to change the html before assets are injected
            .then(([assetTags, html]) => {
              const pluginArgs = { html, headTags: assetTags.headTags, bodyTags: assetTags.bodyTags, plugin: plugin, outputName: options.filename };
              return getHtmlWebpackPluginHooks(compilation).afterTemplateExecution.promise(pluginArgs);
            })
            .then(({ html, headTags, bodyTags }) => {
              return postProcessHtml(html, assets, { headTags, bodyTags });
            });

          const emitHtmlPromise = injectedHtmlPromise
          // Allow plugins to change the html after assets are injected
            .then((html) => {
              const pluginArgs = { html, plugin: plugin, outputName: options.filename };
              return getHtmlWebpackPluginHooks(compilation).beforeEmit.promise(pluginArgs)
                .then(result => result.html);
            })
            .catch(err => {
              // In case anything went wrong the promise is resolved
              // with the error message and an error is logged
              compilation.errors.push(prettyError(err, compiler.context).toString());
              return options.showErrors ? prettyError(err, compiler.context).toHtml() : 'ERROR';
            })
            .then(html => {
              const filename = options.filename.replace(/\[templatehash([^\]]*)\]/g, (__nccwpck_require__(837).deprecate)(
                (match, options) => `[contenthash${options}]`,
                '[templatehash] is now [contenthash]')
              );
              const replacedFilename = replacePlaceholdersInFilename(filename, html, compilation);
              // Add the evaluated html code to the webpack assets
              compilation.emitAsset(replacedFilename.path, new webpack.sources.RawSource(html, false), replacedFilename.info);
              previousEmittedAssets.push({ name: replacedFilename.path, html });
              return replacedFilename.path;
            })
            .then((finalOutputName) => getHtmlWebpackPluginHooks(compilation).afterEmit.promise({
              outputName: finalOutputName,
              plugin: plugin
            }).catch(err => {
              console.error(err);
              return null;
            }).then(() => null));

          // Once all files are added to the webpack compilation
          // let the webpack compiler continue
          emitHtmlPromise.then(() => {
            callback();
          });
        });
    });

  /**
   * Generate the template parameters for the template function
   * @param {WebpackCompilation} compilation
   * @param {{
      publicPath: string,
      js: Array<string>,
      css: Array<string>,
      manifest?: string,
      favicon?: string
    }} assets
   * @param {{
       headTags: HtmlTagObject[],
       bodyTags: HtmlTagObject[]
     }} assetTags
   * @returns {Promise<{[key: any]: any}>}
   */
  function getTemplateParameters (compilation, assets, assetTags) {
    const templateParameters = options.templateParameters;
    if (templateParameters === false) {
      return Promise.resolve({});
    }
    if (typeof templateParameters !== 'function' && typeof templateParameters !== 'object') {
      throw new Error('templateParameters has to be either a function or an object');
    }
    const templateParameterFunction = typeof templateParameters === 'function'
      // A custom function can overwrite the entire template parameter preparation
      ? templateParameters
      // If the template parameters is an object merge it with the default values
      : (compilation, assets, assetTags, options) => Object.assign({},
        templateParametersGenerator(compilation, assets, assetTags, options),
        templateParameters
      );
    const preparedAssetTags = {
      headTags: prepareAssetTagGroupForRendering(assetTags.headTags),
      bodyTags: prepareAssetTagGroupForRendering(assetTags.bodyTags)
    };
    return Promise
      .resolve()
      .then(() => templateParameterFunction(compilation, assets, preparedAssetTags, options));
  }

  /**
   * This function renders the actual html by executing the template function
   *
   * @param {(templateParameters) => string | Promise<string>} templateFunction
   * @param {{
      publicPath: string,
      js: Array<string>,
      css: Array<string>,
      manifest?: string,
      favicon?: string
    }} assets
   * @param {{
       headTags: HtmlTagObject[],
       bodyTags: HtmlTagObject[]
     }} assetTags
   * @param {WebpackCompilation} compilation
   *
   * @returns Promise<string>
   */
  function executeTemplate (templateFunction, assets, assetTags, compilation) {
    // Template processing
    const templateParamsPromise = getTemplateParameters(compilation, assets, assetTags);
    return templateParamsPromise.then((templateParams) => {
      try {
        // If html is a promise return the promise
        // If html is a string turn it into a promise
        return templateFunction(templateParams);
      } catch (e) {
        compilation.errors.push(new Error('Template execution failed: ' + e));
        return Promise.reject(e);
      }
    });
  }

  /**
   * Html Post processing
   *
   * @param {any} html
   * The input html
   * @param {any} assets
   * @param {{
       headTags: HtmlTagObject[],
       bodyTags: HtmlTagObject[]
     }} assetTags
   * The asset tags to inject
   *
   * @returns {Promise<string>}
   */
  function postProcessHtml (html, assets, assetTags) {
    if (typeof html !== 'string') {
      return Promise.reject(new Error('Expected html to be a string but got ' + JSON.stringify(html)));
    }
    const htmlAfterInjection = options.inject
      ? injectAssetsIntoHtml(html, assets, assetTags)
      : html;
    const htmlAfterMinification = minifyHtml(htmlAfterInjection);
    return Promise.resolve(htmlAfterMinification);
  }

  /*
   * Pushes the content of the given filename to the compilation assets
   * @param {string} filename
   * @param {WebpackCompilation} compilation
   *
   * @returns {string} file basename
   */
  function addFileToAssets (filename, compilation) {
    filename = path.resolve(compilation.compiler.context, filename);
    return fsReadFileAsync(filename)
      .then(source => new webpack.sources.RawSource(source, false))
      .catch(() => Promise.reject(new Error('HtmlWebpackPlugin: could not load file ' + filename)))
      .then(rawSource => {
        const basename = path.basename(filename);
        compilation.fileDependencies.add(filename);
        compilation.emitAsset(basename, rawSource);
        return basename;
      });
  }

  /**
   * Replace [contenthash] in filename
   *
   * @see https://survivejs.com/webpack/optimizing/adding-hashes-to-filenames/
   *
   * @param {string} filename
   * @param {string|Buffer} fileContent
   * @param {WebpackCompilation} compilation
   * @returns {{ path: string, info: {} }}
   */
  function replacePlaceholdersInFilename (filename, fileContent, compilation) {
    if (/\[\\*([\w:]+)\\*\]/i.test(filename) === false) {
      return { path: filename, info: {} };
    }
    const hash = compiler.webpack.util.createHash(compilation.outputOptions.hashFunction);
    hash.update(fileContent);
    if (compilation.outputOptions.hashSalt) {
      hash.update(compilation.outputOptions.hashSalt);
    }
    const contentHash = hash.digest(compilation.outputOptions.hashDigest).slice(0, compilation.outputOptions.hashDigestLength);
    return compilation.getPathWithInfo(
      filename,
      {
        contentHash,
        chunk: {
          hash: contentHash,
          contentHash
        }
      }
    );
  }

  /**
   * Helper to sort chunks
   * @param {string[]} entryNames
   * @param {string|((entryNameA: string, entryNameB: string) => number)} sortMode
   * @param {WebpackCompilation} compilation
   */
  function sortEntryChunks (entryNames, sortMode, compilation) {
    // Custom function
    if (typeof sortMode === 'function') {
      return entryNames.sort(sortMode);
    }
    // Check if the given sort mode is a valid chunkSorter sort mode
    if (typeof chunkSorter[sortMode] !== 'undefined') {
      return chunkSorter[sortMode](entryNames, compilation, options);
    }
    throw new Error('"' + sortMode + '" is not a valid chunk sort mode');
  }

  /**
   * Return all chunks from the compilation result which match the exclude and include filters
   * @param {any} chunks
   * @param {string[]|'all'} includedChunks
   * @param {string[]} excludedChunks
   */
  function filterChunks (chunks, includedChunks, excludedChunks) {
    return chunks.filter(chunkName => {
      // Skip if the chunks should be filtered and the given chunk was not added explicity
      if (Array.isArray(includedChunks) && includedChunks.indexOf(chunkName) === -1) {
        return false;
      }
      // Skip if the chunks should be filtered and the given chunk was excluded explicity
      if (Array.isArray(excludedChunks) && excludedChunks.indexOf(chunkName) !== -1) {
        return false;
      }
      // Add otherwise
      return true;
    });
  }

  /**
   * Generate the relative or absolute base url to reference images, css, and javascript files
   * from within the html file - the publicPath
   *
   * @param {WebpackCompilation} compilation
   * @param {string} childCompilationOutputName
   * @param {string | 'auto'} customPublicPath
   * @returns {string}
   */
  function getPublicPath (compilation, childCompilationOutputName, customPublicPath) {
    const compilationHash = compilation.hash;

    /**
     * @type {string} the configured public path to the asset root
     * if a path publicPath is set in the current webpack config use it otherwise
     * fallback to a relative path
     */
    const webpackPublicPath = compilation.getAssetPath(compilation.outputOptions.publicPath, { hash: compilationHash });

    // Webpack 5 introduced "auto" as default value
    const isPublicPathDefined = webpackPublicPath !== 'auto';

    let publicPath =
      // If the html-webpack-plugin options contain a custom public path uset it
      customPublicPath !== 'auto'
        ? customPublicPath
        : (isPublicPathDefined
          // If a hard coded public path exists use it
          ? webpackPublicPath
          // If no public path was set get a relative url path
          : path.relative(path.resolve(compilation.options.output.path, path.dirname(childCompilationOutputName)), compilation.options.output.path)
            .split(path.sep).join('/')
        );

    if (publicPath.length && publicPath.substr(-1, 1) !== '/') {
      publicPath += '/';
    }

    return publicPath;
  }

  /**
   * The htmlWebpackPluginAssets extracts the asset information of a webpack compilation
   * for all given entry names
   * @param {WebpackCompilation} compilation
   * @param {string[]} entryNames
   * @param {string | 'auto'} publicPath
   * @returns {{
      publicPath: string,
      js: Array<string>,
      css: Array<string>,
      manifest?: string,
      favicon?: string
    }}
   */
  function htmlWebpackPluginAssets (compilation, entryNames, publicPath) {
    const compilationHash = compilation.hash;
    /**
     * @type {{
        publicPath: string,
        js: Array<string>,
        css: Array<string>,
        manifest?: string,
        favicon?: string
      }}
     */
    const assets = {
      // The public path
      publicPath,
      // Will contain all js and mjs files
      js: [],
      // Will contain all css files
      css: [],
      // Will contain the html5 appcache manifest files if it exists
      manifest: Object.keys(compilation.assets).find(assetFile => path.extname(assetFile) === '.appcache'),
      // Favicon
      favicon: undefined
    };

    // Append a hash for cache busting
    if (options.hash && assets.manifest) {
      assets.manifest = appendHash(assets.manifest, compilationHash);
    }

    // Extract paths to .js, .mjs and .css files from the current compilation
    const entryPointPublicPathMap = {};
    const extensionRegexp = /\.(css|js|mjs)(\?|$)/;
    for (let i = 0; i < entryNames.length; i++) {
      const entryName = entryNames[i];
      /** entryPointUnfilteredFiles - also includes hot module update files */
      const entryPointUnfilteredFiles = compilation.entrypoints.get(entryName).getFiles();

      const entryPointFiles = entryPointUnfilteredFiles.filter((chunkFile) => {
        // compilation.getAsset was introduced in webpack 4.4.0
        // once the support pre webpack 4.4.0 is dropped please
        // remove the following guard:
        const asset = compilation.getAsset && compilation.getAsset(chunkFile);
        if (!asset) {
          return true;
        }
        // Prevent hot-module files from being included:
        const assetMetaInformation = asset.info || {};
        return !(assetMetaInformation.hotModuleReplacement || assetMetaInformation.development);
      });

      // Prepend the publicPath and append the hash depending on the
      // webpack.output.publicPath and hashOptions
      // E.g. bundle.js -> /bundle.js?hash
      const entryPointPublicPaths = entryPointFiles
        .map(chunkFile => {
          const entryPointPublicPath = publicPath + urlencodePath(chunkFile);
          return options.hash
            ? appendHash(entryPointPublicPath, compilationHash)
            : entryPointPublicPath;
        });

      entryPointPublicPaths.forEach((entryPointPublicPath) => {
        const extMatch = extensionRegexp.exec(entryPointPublicPath);
        // Skip if the public path is not a .css, .mjs or .js file
        if (!extMatch) {
          return;
        }
        // Skip if this file is already known
        // (e.g. because of common chunk optimizations)
        if (entryPointPublicPathMap[entryPointPublicPath]) {
          return;
        }
        entryPointPublicPathMap[entryPointPublicPath] = true;
        // ext will contain .js or .css, because .mjs recognizes as .js
        const ext = extMatch[1] === 'mjs' ? 'js' : extMatch[1];
        assets[ext].push(entryPointPublicPath);
      });
    }
    return assets;
  }

  /**
   * Converts a favicon file from disk to a webpack resource
   * and returns the url to the resource
   *
   * @param {string|false} faviconFilePath
   * @param {WebpackCompilation} compilation
   * @param {string} publicPath
   * @returns {Promise<string|undefined>}
   */
  function getFaviconPublicPath (faviconFilePath, compilation, publicPath) {
    if (!faviconFilePath) {
      return Promise.resolve(undefined);
    }
    return addFileToAssets(faviconFilePath, compilation)
      .then((faviconName) => {
        const faviconPath = publicPath + faviconName;
        if (options.hash) {
          return appendHash(faviconPath, compilation.hash);
        }
        return faviconPath;
      });
  }

  /**
   * Generate all tags script for the given file paths
   * @param {Array<string>} jsAssets
   * @returns {Array<HtmlTagObject>}
   */
  function generatedScriptTags (jsAssets) {
    return jsAssets.map(scriptAsset => ({
      tagName: 'script',
      voidTag: false,
      meta: { plugin: 'html-webpack-plugin' },
      attributes: {
        defer: options.scriptLoading === 'defer',
        type: options.scriptLoading === 'module' ? 'module' : undefined,
        src: scriptAsset
      }
    }));
  }

  /**
   * Generate all style tags for the given file paths
   * @param {Array<string>} cssAssets
   * @returns {Array<HtmlTagObject>}
   */
  function generateStyleTags (cssAssets) {
    return cssAssets.map(styleAsset => ({
      tagName: 'link',
      voidTag: true,
      meta: { plugin: 'html-webpack-plugin' },
      attributes: {
        href: styleAsset,
        rel: 'stylesheet'
      }
    }));
  }

  /**
   * Generate an optional base tag
   * @param { false
            | string
            | {[attributeName: string]: string} // attributes e.g. { href:"http://example.com/page.html" target:"_blank" }
            } baseOption
  * @returns {Array<HtmlTagObject>}
  */
  function generateBaseTag (baseOption) {
    if (baseOption === false) {
      return [];
    } else {
      return [{
        tagName: 'base',
        voidTag: true,
        meta: { plugin: 'html-webpack-plugin' },
        attributes: (typeof baseOption === 'string') ? {
          href: baseOption
        } : baseOption
      }];
    }
  }

  /**
   * Generate all meta tags for the given meta configuration
   * @param {false | {
            [name: string]:
              false // disabled
              | string // name content pair e.g. {viewport: 'width=device-width, initial-scale=1, shrink-to-fit=no'}`
              | {[attributeName: string]: string|boolean} // custom properties e.g. { name:"viewport" content:"width=500, initial-scale=1" }
        }} metaOptions
  * @returns {Array<HtmlTagObject>}
  */
  function generatedMetaTags (metaOptions) {
    if (metaOptions === false) {
      return [];
    }
    // Make tags self-closing in case of xhtml
    // Turn { "viewport" : "width=500, initial-scale=1" } into
    // [{ name:"viewport" content:"width=500, initial-scale=1" }]
    const metaTagAttributeObjects = Object.keys(metaOptions)
      .map((metaName) => {
        const metaTagContent = metaOptions[metaName];
        return (typeof metaTagContent === 'string') ? {
          name: metaName,
          content: metaTagContent
        } : metaTagContent;
      })
      .filter((attribute) => attribute !== false);
      // Turn [{ name:"viewport" content:"width=500, initial-scale=1" }] into
      // the html-webpack-plugin tag structure
    return metaTagAttributeObjects.map((metaTagAttributes) => {
      if (metaTagAttributes === false) {
        throw new Error('Invalid meta tag');
      }
      return {
        tagName: 'meta',
        voidTag: true,
        meta: { plugin: 'html-webpack-plugin' },
        attributes: metaTagAttributes
      };
    });
  }

  /**
   * Generate a favicon tag for the given file path
   * @param {string| undefined} faviconPath
   * @returns {Array<HtmlTagObject>}
   */
  function generateFaviconTags (faviconPath) {
    if (!faviconPath) {
      return [];
    }
    return [{
      tagName: 'link',
      voidTag: true,
      meta: { plugin: 'html-webpack-plugin' },
      attributes: {
        rel: 'icon',
        href: faviconPath
      }
    }];
  }

  /**
   * Group assets to head and bottom tags
   *
   * @param {{
      scripts: Array<HtmlTagObject>;
      styles: Array<HtmlTagObject>;
      meta: Array<HtmlTagObject>;
    }} assetTags
  * @param {"body" | "head"} scriptTarget
  * @returns {{
      headTags: Array<HtmlTagObject>;
      bodyTags: Array<HtmlTagObject>;
    }}
  */
  function generateAssetGroups (assetTags, scriptTarget) {
    /** @type {{ headTags: Array<HtmlTagObject>; bodyTags: Array<HtmlTagObject>; }} */
    const result = {
      headTags: [
        ...assetTags.meta,
        ...assetTags.styles
      ],
      bodyTags: []
    };
    // Add script tags to head or body depending on
    // the htmlPluginOptions
    if (scriptTarget === 'body') {
      result.bodyTags.push(...assetTags.scripts);
    } else {
      // If script loading is blocking add the scripts to the end of the head
      // If script loading is non-blocking add the scripts infront of the css files
      const insertPosition = options.scriptLoading === 'blocking' ? result.headTags.length : assetTags.meta.length;
      result.headTags.splice(insertPosition, 0, ...assetTags.scripts);
    }
    return result;
  }

  /**
   * Add toString methods for easier rendering
   * inside the template
   *
   * @param {Array<HtmlTagObject>} assetTagGroup
   * @returns {Array<HtmlTagObject>}
   */
  function prepareAssetTagGroupForRendering (assetTagGroup) {
    const xhtml = options.xhtml;
    return HtmlTagArray.from(assetTagGroup.map((assetTag) => {
      const copiedAssetTag = Object.assign({}, assetTag);
      copiedAssetTag.toString = function () {
        return htmlTagObjectToString(this, xhtml);
      };
      return copiedAssetTag;
    }));
  }

  /**
   * Injects the assets into the given html string
   *
   * @param {string} html
   * The input html
   * @param {any} assets
   * @param {{
       headTags: HtmlTagObject[],
       bodyTags: HtmlTagObject[]
     }} assetTags
   * The asset tags to inject
   *
   * @returns {string}
   */
  function injectAssetsIntoHtml (html, assets, assetTags) {
    const htmlRegExp = /(<html[^>]*>)/i;
    const headRegExp = /(<\/head\s*>)/i;
    const bodyRegExp = /(<\/body\s*>)/i;
    const body = assetTags.bodyTags.map((assetTagObject) => htmlTagObjectToString(assetTagObject, options.xhtml));
    const head = assetTags.headTags.map((assetTagObject) => htmlTagObjectToString(assetTagObject, options.xhtml));

    if (body.length) {
      if (bodyRegExp.test(html)) {
        // Append assets to body element
        html = html.replace(bodyRegExp, match => body.join('') + match);
      } else {
        // Append scripts to the end of the file if no <body> element exists:
        html += body.join('');
      }
    }

    if (head.length) {
      // Create a head tag if none exists
      if (!headRegExp.test(html)) {
        if (!htmlRegExp.test(html)) {
          html = '<head></head>' + html;
        } else {
          html = html.replace(htmlRegExp, match => match + '<head></head>');
        }
      }

      // Append assets to head element
      html = html.replace(headRegExp, match => head.join('') + match);
    }

    // Inject manifest into the opening html tag
    if (assets.manifest) {
      html = html.replace(/(<html[^>]*)(>)/i, (match, start, end) => {
        // Append the manifest only if no manifest was specified
        if (/\smanifest\s*=/.test(match)) {
          return match;
        }
        return start + ' manifest="' + assets.manifest + '"' + end;
      });
    }
    return html;
  }

  /**
   * Appends a cache busting hash to the query string of the url
   * E.g. http://localhost:8080/ -> http://localhost:8080/?50c9096ba6183fd728eeb065a26ec175
   * @param {string} url
   * @param {string} hash
   */
  function appendHash (url, hash) {
    if (!url) {
      return url;
    }
    return url + (url.indexOf('?') === -1 ? '?' : '&') + hash;
  }

  /**
   * Encode each path component using `encodeURIComponent` as files can contain characters
   * which needs special encoding in URLs like `+ `.
   *
   * Valid filesystem characters which need to be encoded for urls:
   *
   * # pound, % percent, & ampersand, { left curly bracket, } right curly bracket,
   * \ back slash, < left angle bracket, > right angle bracket, * asterisk, ? question mark,
   * blank spaces, $ dollar sign, ! exclamation point, ' single quotes, " double quotes,
   * : colon, @ at sign, + plus sign, ` backtick, | pipe, = equal sign
   *
   * However the query string must not be encoded:
   *
   *  fo:demonstration-path/very fancy+name.js?path=/home?value=abc&value=def#zzz
   *    ^             ^    ^    ^     ^    ^  ^    ^^    ^     ^   ^     ^   ^
   *    |             |    |    |     |    |  |    ||    |     |   |     |   |
   *    encoded       |    |    encoded    |  |    ||    |     |   |     |   |
   *                 ignored              ignored  ignored     ignored   ignored
   *
   * @param {string} filePath
   */
  function urlencodePath (filePath) {
    // People use the filepath in quite unexpected ways.
    // Try to extract the first querystring of the url:
    //
    // some+path/demo.html?value=abc?def
    //
    const queryStringStart = filePath.indexOf('?');
    const urlPath = queryStringStart === -1 ? filePath : filePath.substr(0, queryStringStart);
    const queryString = filePath.substr(urlPath.length);
    // Encode all parts except '/' which are not part of the querystring:
    const encodedUrlPath = urlPath.split('/').map(encodeURIComponent).join('/');
    return encodedUrlPath + queryString;
  }

  /**
   * Helper to return the absolute template path with a fallback loader
   * @param {string} template
   * The path to the template e.g. './index.html'
   * @param {string} context
   * The webpack base resolution path for relative paths e.g. process.cwd()
   */
  function getFullTemplatePath (template, context) {
    if (template === 'auto') {
      template = path.resolve(context, 'src/index.ejs');
      if (!fs.existsSync(template)) {
        template = __nccwpck_require__.ab + "default_index.ejs";
      }
    }
    // If the template doesn't use a loader use the lodash template loader
    if (template.indexOf('!') === -1) {
      template = path.join(__dirname, './lib/loader.js') + '!' + path.resolve(context, template);
    }
    // Resolve template path
    return template.replace(
      /([!])([^/\\][^!?]+|[^/\\!?])($|\?[^!?\n]+$)/,
      (match, prefix, filepath, postfix) => prefix + path.resolve(filepath) + postfix);
  }

  /**
   * Minify the given string using html-minifier-terser
   *
   * As this is a breaking change to html-webpack-plugin 3.x
   * provide an extended error message to explain how to get back
   * to the old behaviour
   *
   * @param {string} html
   */
  function minifyHtml (html) {
    if (typeof options.minify !== 'object') {
      return html;
    }
    try {
      return (__nccwpck_require__(68).minify)(html, options.minify);
    } catch (e) {
      const isParseError = String(e.message).indexOf('Parse Error') === 0;
      if (isParseError) {
        e.message = 'html-webpack-plugin could not minify the generated output.\n' +
            'In production mode the html minifcation is enabled by default.\n' +
            'If you are not generating a valid html output please disable it manually.\n' +
            'You can do so by adding the following setting to your HtmlWebpackPlugin config:\n|\n|' +
            '    minify: false\n|\n' +
            'See https://github.com/jantimon/html-webpack-plugin#options for details.\n\n' +
            'For parser dedicated bugs please create an issue here:\n' +
            'https://danielruf.github.io/html-minifier-terser/' +
          '\n' + e.message;
      }
      throw e;
    }
  }

  /**
   * Helper to return a sorted unique array of all asset files out of the
   * asset object
   */
  function getAssetFiles (assets) {
    const files = _.uniq(Object.keys(assets).filter(assetType => assetType !== 'chunks' && assets[assetType]).reduce((files, assetType) => files.concat(assets[assetType]), []));
    files.sort();
    return files;
  }
}

/**
 * The default for options.templateParameter
 * Generate the template parameters
 *
 * Generate the template parameters for the template function
 * @param {WebpackCompilation} compilation
 * @param {{
   publicPath: string,
   js: Array<string>,
   css: Array<string>,
   manifest?: string,
   favicon?: string
 }} assets
 * @param {{
     headTags: HtmlTagObject[],
     bodyTags: HtmlTagObject[]
   }} assetTags
 * @param {ProcessedHtmlWebpackOptions} options
 * @returns {TemplateParameter}
 */
function templateParametersGenerator (compilation, assets, assetTags, options) {
  return {
    compilation: compilation,
    webpackConfig: compilation.options,
    htmlWebpackPlugin: {
      tags: assetTags,
      files: assets,
      options: options
    }
  };
}

// Statics:
/**
 * The major version number of this plugin
 */
HtmlWebpackPlugin.version = 5;

/**
 * A static helper to get the hooks for this plugin
 *
 * Usage: HtmlWebpackPlugin.getHooks(compilation).HOOK_NAME.tapAsync('YourPluginName', () => { ... });
 */
HtmlWebpackPlugin.getHooks = getHtmlWebpackPluginHooks;
HtmlWebpackPlugin.createHtmlTagObject = createHtmlTagObject;

module.exports = HtmlWebpackPlugin;


/***/ }),

/***/ 629:
/***/ (function(module, __unused_webpack_exports, __nccwpck_require__) {

"use strict";
// @ts-check
/**
 * @file
 * Helper plugin manages the cached state of the child compilation
 *
 * To optimize performance the child compilation is running asyncronously.
 * Therefore it needs to be started in the compiler.make phase and ends after
 * the compilation.afterCompile phase.
 *
 * To prevent bugs from blocked hooks there is no promise or event based api
 * for this plugin.
 *
 * Example usage:
 *
 * ```js
    const childCompilerPlugin = new PersistentChildCompilerPlugin();
    childCompilerPlugin.addEntry('./src/index.js');
    compiler.hooks.afterCompile.tapAsync('MyPlugin', (compilation, callback) => {
      console.log(childCompilerPlugin.getCompilationResult()['./src/index.js']));
      return true;
    });
 * ```
 */

// Import types
/** @typedef {import("webpack/lib/Compiler.js")} WebpackCompiler */
/** @typedef {import("webpack/lib/Compilation.js")} WebpackCompilation */
/** @typedef {{hash: string, entry: any, content: string }} ChildCompilationResultEntry */
/** @typedef {import("./file-watcher-api").Snapshot} Snapshot */
/** @typedef {{fileDependencies: string[], contextDependencies: string[], missingDependencies: string[]}} FileDependencies */
/** @typedef {{
  dependencies: FileDependencies,
  compiledEntries: {[entryName: string]: ChildCompilationResultEntry}
} | {
  dependencies: FileDependencies,
  error: Error
}} ChildCompilationResult */


const { HtmlWebpackChildCompiler } = __nccwpck_require__(666);
const fileWatcherApi = __nccwpck_require__(968);

/**
 * This plugin is a singleton for performance reasons.
 * To keep track if a plugin does already exist for the compiler they are cached
 * in this map
 * @type {WeakMap<WebpackCompiler, PersistentChildCompilerSingletonPlugin>}}
 */
const compilerMap = new WeakMap();

class CachedChildCompilation {
  /**
   * @param {WebpackCompiler} compiler
   */
  constructor (compiler) {
    /**
     * @private
     * @type {WebpackCompiler}
     */
    this.compiler = compiler;
    // Create a singleton instance for the compiler
    // if there is none
    if (compilerMap.has(compiler)) {
      return;
    }
    const persistentChildCompilerSingletonPlugin = new PersistentChildCompilerSingletonPlugin();
    compilerMap.set(compiler, persistentChildCompilerSingletonPlugin);
    persistentChildCompilerSingletonPlugin.apply(compiler);
  }

  /**
   * apply is called by the webpack main compiler during the start phase
   * @param {string} entry
   */
  addEntry (entry) {
    const persistentChildCompilerSingletonPlugin = compilerMap.get(this.compiler);
    if (!persistentChildCompilerSingletonPlugin) {
      throw new Error(
        'PersistentChildCompilerSingletonPlugin instance not found.'
      );
    }
    persistentChildCompilerSingletonPlugin.addEntry(entry);
  }

  getCompilationResult () {
    const persistentChildCompilerSingletonPlugin = compilerMap.get(this.compiler);
    if (!persistentChildCompilerSingletonPlugin) {
      throw new Error(
        'PersistentChildCompilerSingletonPlugin instance not found.'
      );
    }
    return persistentChildCompilerSingletonPlugin.getLatestResult();
  }

  /**
   * Returns the result for the given entry
   * @param {string} entry
   * @returns {
      | { mainCompilationHash: string, error: Error }
      | { mainCompilationHash: string, compiledEntry: ChildCompilationResultEntry }
    }
   */
  getCompilationEntryResult (entry) {
    const latestResult = this.getCompilationResult();
    const compilationResult = latestResult.compilationResult;
    return 'error' in compilationResult ? {
      mainCompilationHash: latestResult.mainCompilationHash,
      error: compilationResult.error
    } : {
      mainCompilationHash: latestResult.mainCompilationHash,
      compiledEntry: compilationResult.compiledEntries[entry]
    };
  }
}

class PersistentChildCompilerSingletonPlugin {
  constructor () {
    /**
     * @private
     * @type {
      | {
        isCompiling: false,
        isVerifyingCache: false,
        entries: string[],
        compiledEntries: string[],
        mainCompilationHash: string,
        compilationResult: ChildCompilationResult
      }
    | Readonly<{
      isCompiling: false,
      isVerifyingCache: true,
      entries: string[],
      previousEntries: string[],
      previousResult: ChildCompilationResult
    }>
    | Readonly <{
      isVerifyingCache: false,
      isCompiling: true,
      entries: string[],
    }>
  } the internal compilation state */
    this.compilationState = {
      isCompiling: false,
      isVerifyingCache: false,
      entries: [],
      compiledEntries: [],
      mainCompilationHash: 'initial',
      compilationResult: {
        dependencies: {
          fileDependencies: [],
          contextDependencies: [],
          missingDependencies: []
        },
        compiledEntries: {}
      }
    };
  }

  /**
   * apply is called by the webpack main compiler during the start phase
   * @param {WebpackCompiler} compiler
   */
  apply (compiler) {
    /** @type Promise<ChildCompilationResult> */
    let childCompilationResultPromise = Promise.resolve({
      dependencies: {
        fileDependencies: [],
        contextDependencies: [],
        missingDependencies: []
      },
      compiledEntries: {}
    });
    /**
     * The main compilation hash which will only be updated
     * if the childCompiler changes
     */
    let mainCompilationHashOfLastChildRecompile = '';
    /** @typedef{Snapshot|undefined} */
    let previousFileSystemSnapshot;
    let compilationStartTime = new Date().getTime();

    compiler.hooks.make.tapAsync(
      'PersistentChildCompilerSingletonPlugin',
      (mainCompilation, callback) => {
        if (this.compilationState.isCompiling || this.compilationState.isVerifyingCache) {
          return callback(new Error('Child compilation has already started'));
        }

        // Update the time to the current compile start time
        compilationStartTime = new Date().getTime();

        // The compilation starts - adding new templates is now not possible anymore
        this.compilationState = {
          isCompiling: false,
          isVerifyingCache: true,
          previousEntries: this.compilationState.compiledEntries,
          previousResult: this.compilationState.compilationResult,
          entries: this.compilationState.entries
        };

        // Validate cache:
        const isCacheValidPromise = this.isCacheValid(previousFileSystemSnapshot, mainCompilation);

        let cachedResult = childCompilationResultPromise;
        childCompilationResultPromise = isCacheValidPromise.then((isCacheValid) => {
          // Reuse cache
          if (isCacheValid) {
            return cachedResult;
          }
          // Start the compilation
          const compiledEntriesPromise = this.compileEntries(
            mainCompilation,
            this.compilationState.entries
          );
          // Update snapshot as soon as we know the filedependencies
          // this might possibly cause bugs if files were changed inbetween
          // compilation start and snapshot creation
          compiledEntriesPromise.then((childCompilationResult) => {
            return fileWatcherApi.createSnapshot(childCompilationResult.dependencies, mainCompilation, compilationStartTime);
          }).then((snapshot) => {
            previousFileSystemSnapshot = snapshot;
          });
          return compiledEntriesPromise;
        });

        // Add files to compilation which needs to be watched:
        mainCompilation.hooks.optimizeTree.tapAsync(
          'PersistentChildCompilerSingletonPlugin',
          (chunks, modules, callback) => {
            const handleCompilationDonePromise = childCompilationResultPromise.then(
              childCompilationResult => {
                this.watchFiles(
                  mainCompilation,
                  childCompilationResult.dependencies
                );
              });
            handleCompilationDonePromise.then(() => callback(null, chunks, modules), callback);
          }
        );

        // Store the final compilation once the main compilation hash is known
        mainCompilation.hooks.additionalAssets.tapAsync(
          'PersistentChildCompilerSingletonPlugin',
          (callback) => {
            const didRecompilePromise = Promise.all([childCompilationResultPromise, cachedResult]).then(
              ([childCompilationResult, cachedResult]) => {
                // Update if childCompilation changed
                return (cachedResult !== childCompilationResult);
              }
            );

            const handleCompilationDonePromise = Promise.all([childCompilationResultPromise, didRecompilePromise]).then(
              ([childCompilationResult, didRecompile]) => {
                // Update hash and snapshot if childCompilation changed
                if (didRecompile) {
                  mainCompilationHashOfLastChildRecompile = mainCompilation.hash;
                }
                this.compilationState = {
                  isCompiling: false,
                  isVerifyingCache: false,
                  entries: this.compilationState.entries,
                  compiledEntries: this.compilationState.entries,
                  compilationResult: childCompilationResult,
                  mainCompilationHash: mainCompilationHashOfLastChildRecompile
                };
              });
            handleCompilationDonePromise.then(() => callback(null), callback);
          }
        );

        // Continue compilation:
        callback(null);
      }
    );
  }

  /**
   * Add a new entry to the next compile run
   * @param {string} entry
   */
  addEntry (entry) {
    if (this.compilationState.isCompiling || this.compilationState.isVerifyingCache) {
      throw new Error(
        'The child compiler has already started to compile. ' +
        "Please add entries before the main compiler 'make' phase has started or " +
        'after the compilation is done.'
      );
    }
    if (this.compilationState.entries.indexOf(entry) === -1) {
      this.compilationState.entries = [...this.compilationState.entries, entry];
    }
  }

  getLatestResult () {
    if (this.compilationState.isCompiling || this.compilationState.isVerifyingCache) {
      throw new Error(
        'The child compiler is not done compiling. ' +
        "Please access the result after the compiler 'make' phase has started or " +
        'after the compilation is done.'
      );
    }
    return {
      mainCompilationHash: this.compilationState.mainCompilationHash,
      compilationResult: this.compilationState.compilationResult
    };
  }

  /**
   * Verify that the cache is still valid
   * @private
   * @param {Snapshot | undefined} snapshot
   * @param {WebpackCompilation} mainCompilation
   * @returns {Promise<boolean>}
   */
  isCacheValid (snapshot, mainCompilation) {
    if (!this.compilationState.isVerifyingCache) {
      return Promise.reject(new Error('Cache validation can only be done right before the compilation starts'));
    }
    // If there are no entries we don't need a new child compilation
    if (this.compilationState.entries.length === 0) {
      return Promise.resolve(true);
    }
    // If there are new entries the cache is invalid
    if (this.compilationState.entries !== this.compilationState.previousEntries) {
      return Promise.resolve(false);
    }
    // Mark the cache as invalid if there is no snapshot
    if (!snapshot) {
      return Promise.resolve(false);
    }
    return fileWatcherApi.isSnapShotValid(snapshot, mainCompilation);
  }

  /**
   * Start to compile all templates
   *
   * @private
   * @param {WebpackCompilation} mainCompilation
   * @param {string[]} entries
   * @returns {Promise<ChildCompilationResult>}
   */
  compileEntries (mainCompilation, entries) {
    const compiler = new HtmlWebpackChildCompiler(entries);
    return compiler.compileTemplates(mainCompilation).then((result) => {
      return {
      // The compiled sources to render the content
        compiledEntries: result,
        // The file dependencies to find out if a
        // recompilation is required
        dependencies: compiler.fileDependencies,
        // The main compilation hash can be used to find out
        // if this compilation was done during the current compilation
        mainCompilationHash: mainCompilation.hash
      };
    }, error => ({
      // The compiled sources to render the content
      error,
      // The file dependencies to find out if a
      // recompilation is required
      dependencies: compiler.fileDependencies,
      // The main compilation hash can be used to find out
      // if this compilation was done during the current compilation
      mainCompilationHash: mainCompilation.hash
    }));
  }

  /**
   * @private
   * @param {WebpackCompilation} mainCompilation
   * @param {FileDependencies} files
   */
  watchFiles (mainCompilation, files) {
    fileWatcherApi.watchFiles(mainCompilation, files);
  }
}

module.exports = {
  CachedChildCompilation
};


/***/ }),

/***/ 666:
/***/ (function(module) {

"use strict";
// @ts-check
/** @typedef {import("webpack/lib/Compilation.js")} WebpackCompilation */
/** @typedef {import("webpack/lib/Compiler.js")} WebpackCompiler */
/** @typedef {import("webpack/lib/Chunk.js")} WebpackChunk */

/**
 * @file
 * This file uses webpack to compile a template with a child compiler.
 *
 * [TEMPLATE] -> [JAVASCRIPT]
 *
 */
'use strict';

let instanceId = 0;
/**
 * The HtmlWebpackChildCompiler is a helper to allow reusing one childCompiler
 * for multiple HtmlWebpackPlugin instances to improve the compilation performance.
 */
class HtmlWebpackChildCompiler {
  /**
   *
   * @param {string[]} templates
   */
  constructor (templates) {
    /** Id for this ChildCompiler */
    this.id = instanceId++;
    /**
     * @type {string[]} templateIds
     * The template array will allow us to keep track which input generated which output
     */
    this.templates = templates;
    /**
     * @type {Promise<{[templatePath: string]: { content: string, hash: string, entry: WebpackChunk }}>}
     */
    this.compilationPromise; // eslint-disable-line
    /**
     * @type {number}
     */
    this.compilationStartedTimestamp; // eslint-disable-line
    /**
     * @type {number}
     */
    this.compilationEndedTimestamp; // eslint-disable-line
    /**
     * All file dependencies of the child compiler
     * @type {{fileDependencies: string[], contextDependencies: string[], missingDependencies: string[]}}
     */
    this.fileDependencies = { fileDependencies: [], contextDependencies: [], missingDependencies: [] };
  }

  /**
   * Returns true if the childCompiler is currently compiling
   * @returns {boolean}
   */
  isCompiling () {
    return !this.didCompile() && this.compilationStartedTimestamp !== undefined;
  }

  /**
   * Returns true if the childCompiler is done compiling
   */
  didCompile () {
    return this.compilationEndedTimestamp !== undefined;
  }

  /**
   * This function will start the template compilation
   * once it is started no more templates can be added
   *
   * @param {import('webpack').Compilation} mainCompilation
   * @returns {Promise<{[templatePath: string]: { content: string, hash: string, entry: WebpackChunk }}>}
   */
  compileTemplates (mainCompilation) {
    const webpack = mainCompilation.compiler.webpack;
    const Compilation = webpack.Compilation;

    const NodeTemplatePlugin = webpack.node.NodeTemplatePlugin;
    const NodeTargetPlugin = webpack.node.NodeTargetPlugin;
    const LoaderTargetPlugin = webpack.LoaderTargetPlugin;
    const EntryPlugin = webpack.EntryPlugin;

    // To prevent multiple compilations for the same template
    // the compilation is cached in a promise.
    // If it already exists return
    if (this.compilationPromise) {
      return this.compilationPromise;
    }

    const outputOptions = {
      filename: '__child-[name]',
      publicPath: '',
      library: {
        type: 'var',
        name: 'HTML_WEBPACK_PLUGIN_RESULT'
      },
      scriptType: /** @type {'text/javascript'} */('text/javascript'),
      iife: true
    };
    const compilerName = 'HtmlWebpackCompiler';
    // Create an additional child compiler which takes the template
    // and turns it into an Node.JS html factory.
    // This allows us to use loaders during the compilation
    const childCompiler = mainCompilation.createChildCompiler(compilerName, outputOptions, [
      // Compile the template to nodejs javascript
      new NodeTargetPlugin(),
      new NodeTemplatePlugin(),
      new LoaderTargetPlugin('node'),
      new webpack.library.EnableLibraryPlugin('var')
    ]);
    // The file path context which webpack uses to resolve all relative files to
    childCompiler.context = mainCompilation.compiler.context;

    // Generate output file names
    const temporaryTemplateNames = this.templates.map((template, index) => `__child-HtmlWebpackPlugin_${index}-${this.id}`);

    // Add all templates
    this.templates.forEach((template, index) => {
      new EntryPlugin(childCompiler.context, 'data:text/javascript,__webpack_public_path__ = __webpack_base_uri__ = htmlWebpackPluginPublicPath;', `HtmlWebpackPlugin_${index}-${this.id}`).apply(childCompiler);
      new EntryPlugin(childCompiler.context, template, `HtmlWebpackPlugin_${index}-${this.id}`).apply(childCompiler);
    });

    // The templates are compiled and executed by NodeJS - similar to server side rendering
    // Unfortunately this causes issues as some loaders require an absolute URL to support ES Modules
    // The following config enables relative URL support for the child compiler
    childCompiler.options.module = { ...childCompiler.options.module };
    childCompiler.options.module.parser = { ...childCompiler.options.module.parser };
    childCompiler.options.module.parser.javascript = { ...childCompiler.options.module.parser.javascript,
      url: 'relative' };

    this.compilationStartedTimestamp = new Date().getTime();
    this.compilationPromise = new Promise((resolve, reject) => {
      const extractedAssets = [];
      childCompiler.hooks.thisCompilation.tap('HtmlWebpackPlugin', (compilation) => {
        compilation.hooks.processAssets.tap(
          {
            name: 'HtmlWebpackPlugin',
            stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
          },
          (assets) => {
            temporaryTemplateNames.forEach((temporaryTemplateName) => {
              if (assets[temporaryTemplateName]) {
                extractedAssets.push(assets[temporaryTemplateName]);
                compilation.deleteAsset(temporaryTemplateName);
              }
            });
          }
        );
      });

      childCompiler.runAsChild((err, entries, childCompilation) => {
        // Extract templates
        const compiledTemplates = entries
          ? extractedAssets.map((asset) => asset.source())
          : [];
        // Extract file dependencies
        if (entries && childCompilation) {
          this.fileDependencies = { fileDependencies: Array.from(childCompilation.fileDependencies), contextDependencies: Array.from(childCompilation.contextDependencies), missingDependencies: Array.from(childCompilation.missingDependencies) };
        }
        // Reject the promise if the childCompilation contains error
        if (childCompilation && childCompilation.errors && childCompilation.errors.length) {
          const errorDetails = childCompilation.errors.map(error => {
            let message = error.message;
            if (error.stack) {
              message += '\n' + error.stack;
            }
            return message;
          }).join('\n');
          reject(new Error('Child compilation failed:\n' + errorDetails));
          return;
        }
        // Reject if the error object contains errors
        if (err) {
          reject(err);
          return;
        }
        if (!childCompilation || !entries) {
          reject(new Error('Empty child compilation'));
          return;
        }
        /**
         * @type {{[templatePath: string]: { content: string, hash: string, entry: WebpackChunk }}}
         */
        const result = {};
        compiledTemplates.forEach((templateSource, entryIndex) => {
          // The compiledTemplates are generated from the entries added in
          // the addTemplate function.
          // Therefore the array index of this.templates should be the as entryIndex.
          result[this.templates[entryIndex]] = {
            content: templateSource,
            hash: childCompilation.hash || 'XXXX',
            entry: entries[entryIndex]
          };
        });
        this.compilationEndedTimestamp = new Date().getTime();
        resolve(result);
      });
    });

    return this.compilationPromise;
  }
}

module.exports = {
  HtmlWebpackChildCompiler
};


/***/ }),

/***/ 328:
/***/ (function(module) {

"use strict";
// @ts-check
/** @typedef {import("webpack/lib/Compilation.js")} WebpackCompilation */


/**
 * @type {{[sortmode: string] : (entryPointNames: Array<string>, compilation, htmlWebpackPluginOptions) => Array<string> }}
 * This file contains different sort methods for the entry chunks names
 */
module.exports = {};

/**
 * Performs identity mapping (no-sort).
 * @param  {Array} chunks the chunks to sort
 * @return {Array} The sorted chunks
 */
module.exports.none = chunks => chunks;

/**
 * Sort manually by the chunks
 * @param  {string[]} entryPointNames the chunks to sort
 * @param  {WebpackCompilation} compilation the webpack compilation
 * @param  htmlWebpackPluginOptions the plugin options
 * @return {string[]} The sorted chunks
 */
module.exports.manual = (entryPointNames, compilation, htmlWebpackPluginOptions) => {
  const chunks = htmlWebpackPluginOptions.chunks;
  if (!Array.isArray(chunks)) {
    return entryPointNames;
  }
  // Remove none existing entries from
  // htmlWebpackPluginOptions.chunks
  return chunks.filter((entryPointName) => {
    return compilation.entrypoints.has(entryPointName);
  });
};

/**
 * Defines the default sorter.
 */
module.exports.auto = module.exports.none;


/***/ }),

/***/ 36:
/***/ (function(module, __unused_webpack_exports, __nccwpck_require__) {

"use strict";
// @ts-nocheck

const PrettyError = __nccwpck_require__(707);
const prettyError = new PrettyError();
prettyError.withoutColors();
prettyError.skipPackage('html-plugin-evaluation');
prettyError.skipNodeFiles();
prettyError.skip(function (traceLine) {
  return traceLine.path === 'html-plugin-evaluation';
});

module.exports = function (err, context) {
  return {
    toHtml: function () {
      return 'Html Webpack Plugin:\n<pre>\n' + this.toString() + '</pre>';
    },
    toJsonHtml: function () {
      return JSON.stringify(this.toHtml());
    },
    toString: function () {
      try {
        return prettyError.render(err).replace(/webpack:\/\/\/\./g, context);
      } catch (e) {
        // This can sometimes fail. We don't know why, but returning the
        // original error is better than returning the error thrown by
        // pretty-error.
        return err;
      }
    }
  };
};


/***/ }),

/***/ 968:
/***/ (function(module) {

"use strict";
// @ts-check
/** @typedef {import("webpack/lib/Compilation.js")} WebpackCompilation */
/** @typedef {import("webpack/lib/FileSystemInfo").Snapshot} Snapshot */


/**
 *
 * @param {{fileDependencies: string[], contextDependencies: string[], missingDependencies: string[]}} fileDependencies
 * @param {WebpackCompilation} mainCompilation
 * @param {number} startTime
 */
function createSnapshot (fileDependencies, mainCompilation, startTime) {
  return new Promise((resolve, reject) => {
    mainCompilation.fileSystemInfo.createSnapshot(
      startTime,
      fileDependencies.fileDependencies,
      fileDependencies.contextDependencies,
      fileDependencies.missingDependencies,
      null,
      (err, snapshot) => {
        if (err) {
          return reject(err);
        }
        resolve(snapshot);
      }
    );
  });
}

/**
 * Returns true if the files inside this snapshot
 * have not been changed
 *
 * @param {Snapshot} snapshot
 * @param {WebpackCompilation} mainCompilation
 * @returns {Promise<boolean>}
 */
function isSnapShotValid (snapshot, mainCompilation) {
  return new Promise((resolve, reject) => {
    mainCompilation.fileSystemInfo.checkSnapshotValid(
      snapshot,
      (err, isValid) => {
        if (err) {
          reject(err);
        }
        resolve(isValid);
      }
    );
  });
}

/**
 * Ensure that the files keep watched for changes
 * and will trigger a recompile
 *
 * @param {WebpackCompilation} mainCompilation
 * @param {{fileDependencies: string[], contextDependencies: string[], missingDependencies: string[]}} fileDependencies
 */
function watchFiles (mainCompilation, fileDependencies) {
  Object.keys(fileDependencies).forEach((depencyTypes) => {
    fileDependencies[depencyTypes].forEach(fileDependency => {
      mainCompilation[depencyTypes].add(fileDependency);
    });
  });
}

module.exports = {
  createSnapshot,
  isSnapShotValid,
  watchFiles
};


/***/ }),

/***/ 380:
/***/ (function(module, __unused_webpack_exports, __nccwpck_require__) {

"use strict";
// @ts-check
/** @typedef {import("../typings").Hooks} HtmlWebpackPluginHooks */

/**
 * This file provides access to all public htmlWebpackPlugin hooks
 */

/** @typedef {import("webpack/lib/Compilation.js")} WebpackCompilation */
/** @typedef {import("../index.js")} HtmlWebpackPlugin */

const AsyncSeriesWaterfallHook = (__nccwpck_require__(312).AsyncSeriesWaterfallHook);

// The following is the API definition for all available hooks
// For the TypeScript definition, see the Hooks type in typings.d.ts
/**
  beforeAssetTagGeneration:
    AsyncSeriesWaterfallHook<{
      assets: {
        publicPath: string,
        js: Array<string>,
        css: Array<string>,
        favicon?: string | undefined,
        manifest?: string | undefined
      },
      outputName: string,
      plugin: HtmlWebpackPlugin
    }>,
  alterAssetTags:
    AsyncSeriesWaterfallHook<{
      assetTags: {
        scripts: Array<HtmlTagObject>,
        styles: Array<HtmlTagObject>,
        meta: Array<HtmlTagObject>,
      },
      publicPath: string,
      outputName: string,
      plugin: HtmlWebpackPlugin
    }>,
  alterAssetTagGroups:
    AsyncSeriesWaterfallHook<{
      headTags: Array<HtmlTagObject | HtmlTagObject>,
      bodyTags: Array<HtmlTagObject | HtmlTagObject>,
      publicPath: string,
      outputName: string,
      plugin: HtmlWebpackPlugin
    }>,
  afterTemplateExecution:
    AsyncSeriesWaterfallHook<{
      html: string,
      headTags: Array<HtmlTagObject | HtmlTagObject>,
      bodyTags: Array<HtmlTagObject | HtmlTagObject>,
      outputName: string,
      plugin: HtmlWebpackPlugin,
    }>,
  beforeEmit:
    AsyncSeriesWaterfallHook<{
      html: string,
      outputName: string,
      plugin: HtmlWebpackPlugin,
    }>,
  afterEmit:
    AsyncSeriesWaterfallHook<{
      outputName: string,
      plugin: HtmlWebpackPlugin
    }>
*/

/**
 * @type {WeakMap<WebpackCompilation, HtmlWebpackPluginHooks>}}
 */
const htmlWebpackPluginHooksMap = new WeakMap();

/**
 * Returns all public hooks of the html webpack plugin for the given compilation
 *
 * @param {WebpackCompilation} compilation
 * @returns {HtmlWebpackPluginHooks}
 */
function getHtmlWebpackPluginHooks (compilation) {
  let hooks = htmlWebpackPluginHooksMap.get(compilation);
  // Setup the hooks only once
  if (hooks === undefined) {
    hooks = createHtmlWebpackPluginHooks();
    htmlWebpackPluginHooksMap.set(compilation, hooks);
  }
  return hooks;
}

/**
 * Add hooks to the webpack compilation object to allow foreign plugins to
 * extend the HtmlWebpackPlugin
 *
 * @returns {HtmlWebpackPluginHooks}
 */
function createHtmlWebpackPluginHooks () {
  return {
    beforeAssetTagGeneration: new AsyncSeriesWaterfallHook(['pluginArgs']),
    alterAssetTags: new AsyncSeriesWaterfallHook(['pluginArgs']),
    alterAssetTagGroups: new AsyncSeriesWaterfallHook(['pluginArgs']),
    afterTemplateExecution: new AsyncSeriesWaterfallHook(['pluginArgs']),
    beforeEmit: new AsyncSeriesWaterfallHook(['pluginArgs']),
    afterEmit: new AsyncSeriesWaterfallHook(['pluginArgs'])
  };
}

module.exports = {
  getHtmlWebpackPluginHooks
};


/***/ }),

/***/ 919:
/***/ (function(module) {

// @ts-check
/** @typedef {import("../typings").HtmlTagObject} HtmlTagObject */
/**
 * @file
 * This file provides to helper to create html as a object representation as
 * those objects are easier to modify than pure string representations
 *
 * Usage:
 * ```
 * const element = createHtmlTagObject('h1', {class: 'demo'}, 'Hello World');
 * const html = htmlTagObjectToString(element);
 * console.log(html) // -> <h1 class="demo">Hello World</h1>
 * ```
 */

/**
 * All html tag elements which must not contain innerHTML
 * @see https://www.w3.org/TR/html5/syntax.html#void-elements
 */
const voidTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

/**
 * Turn a tag definition into a html string
 * @param {HtmlTagObject} tagDefinition
 *  A tag element according to the htmlWebpackPlugin object notation
 *
 * @param xhtml {boolean}
 *   Whether the generated html should add closing slashes to be xhtml compliant
 */
function htmlTagObjectToString (tagDefinition, xhtml) {
  const attributes = Object.keys(tagDefinition.attributes || {})
    .filter(function (attributeName) {
      return tagDefinition.attributes[attributeName] === '' || tagDefinition.attributes[attributeName];
    })
    .map(function (attributeName) {
      if (tagDefinition.attributes[attributeName] === true) {
        return xhtml ? attributeName + '="' + attributeName + '"' : attributeName;
      }
      return attributeName + '="' + tagDefinition.attributes[attributeName] + '"';
    });
  return '<' + [tagDefinition.tagName].concat(attributes).join(' ') + (tagDefinition.voidTag && xhtml ? '/' : '') + '>' +
    (tagDefinition.innerHTML || '') +
    (tagDefinition.voidTag ? '' : '</' + tagDefinition.tagName + '>');
}

/**
 * Static helper to create a tag object to be get injected into the dom
 *
 * @param {string} tagName
 * the name of the tag e.g. 'div'
 *
 * @param {{[attributeName: string]: string|boolean|null|undefined}} [attributes]
 * tag attributes e.g. `{ 'class': 'example', disabled: true }`
 *
 * @param {string} [innerHTML]
 *
 * @param {{[attributeName: string]: string|boolean|null|undefined}} [meta]
 * meta information about the tag e.g. `{ 'plugin': 'html-webpack-plugin' }`
 *
 * @returns {HtmlTagObject}
 */
function createHtmlTagObject (tagName, attributes, innerHTML, meta) {
  return {
    tagName: tagName,
    voidTag: voidTags.indexOf(tagName) !== -1,
    attributes: attributes || {},
    meta: meta || {},
    innerHTML: innerHTML
  };
}

/**
 * The `HtmlTagArray Array with a custom `.toString()` method.
 *
 * This allows the following:
 * ```
 *   const tags = HtmlTagArray.from([tag1, tag2]);
 *   const scriptTags = tags.filter((tag) => tag.tagName === 'script');
 *   const html = scriptTags.toString();
 * ```
 *
 * Or inside a string literal:
 * ```
 *   const tags = HtmlTagArray.from([tag1, tag2]);
 *   const html = `<html><body>${tags.filter((tag) => tag.tagName === 'script')}</body></html>`;
 * ```
 *
 */
class HtmlTagArray extends Array {
  toString () {
    return this.join('');
  }
}

module.exports = {
  HtmlTagArray: HtmlTagArray,
  createHtmlTagObject: createHtmlTagObject,
  htmlTagObjectToString: htmlTagObjectToString
};


/***/ }),

/***/ 707:
/***/ (function(module) {

module.exports = eval("require")("@fe6/biu-deps-webpack/compiled/pretty-error");


/***/ }),

/***/ 312:
/***/ (function(module) {

module.exports = eval("require")("@fe6/biu-deps-webpack/compiled/tapable");


/***/ }),

/***/ 829:
/***/ (function(module) {

"use strict";
module.exports = require("@fe6/biu-deps-webpack/compiled/lodash");

/***/ }),

/***/ 206:
/***/ (function(module) {

"use strict";
module.exports = require("console");

/***/ }),

/***/ 147:
/***/ (function(module) {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 68:
/***/ (function(module) {

"use strict";
module.exports = require("html-minifier-terser");

/***/ }),

/***/ 17:
/***/ (function(module) {

"use strict";
module.exports = require("path");

/***/ }),

/***/ 310:
/***/ (function(module) {

"use strict";
module.exports = require("url");

/***/ }),

/***/ 837:
/***/ (function(module) {

"use strict";
module.exports = require("util");

/***/ }),

/***/ 144:
/***/ (function(module) {

"use strict";
module.exports = require("vm");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(486);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;