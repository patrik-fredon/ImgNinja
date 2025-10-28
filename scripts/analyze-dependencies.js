#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

/**
 * Analyze dependencies and detect unused packages
 */
class DependencyAnalyzer {
  constructor() {
    this.packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
    this.usedDependencies = new Set();
    this.configFiles = [
      "next.config.ts",
      "tailwind.config.ts",
      "postcss.config.mjs",
      "tsconfig.json",
      ".eslintrc.json",
      "biome.json",
    ];
  }

  /**
   * Scan source files for import statements
   */
  scanSourceFiles(dir = "src") {
    const files = this.getAllFiles(dir, [".ts", ".tsx", ".js", ".jsx"]);

    files.forEach((file) => {
      const content = fs.readFileSync(file, "utf8");
      this.extractImports(content);
    });
  }

  /**
   * Scan configuration files for dependencies
   */
  scanConfigFiles() {
    this.configFiles.forEach((configFile) => {
      if (fs.existsSync(configFile)) {
        const content = fs.readFileSync(configFile, "utf8");
        this.extractImports(content);
        this.extractConfigDependencies(content, configFile);
      }
    });
  }

  /**
   * Get all files with specific extensions
   */
  getAllFiles(dir, extensions) {
    const files = [];

    if (!fs.existsSync(dir)) return files;

    const items = fs.readdirSync(dir);

    items.forEach((item) => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith(".") && item !== "node_modules") {
        files.push(...this.getAllFiles(fullPath, extensions));
      } else if (stat.isFile() && extensions.some((ext) => item.endsWith(ext))) {
        files.push(fullPath);
      }
    });

    return files;
  }

  /**
   * Extract import statements from file content
   */
  extractImports(content) {
    // Match various import patterns
    const importPatterns = [
      /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
      /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    ];

    importPatterns.forEach((pattern) => {
      let match;
      let match = pattern.exec(content);
      while (match !== null) {
        const importPath = match[1];

        // Skip relative imports
        if (importPath.startsWith(".") || importPath.startsWith("/")) {
          continue;
        }

        // Extract package name (handle scoped packages)
        const packageName = this.extractPackageName(importPath);
        if (packageName) {
          this.usedDependencies.add(packageName);
        }
        match = pattern.exec(content);
      }
    });
  }

  /**
   * Extract dependencies from configuration files
   */
  extractConfigDependencies(content, filename) {
    const configDeps = {
      "next.config.ts": ["@next/bundle-analyzer"],
      "postcss.config.mjs": ["autoprefixer", "@tailwindcss/postcss"],
      "tailwind.config.ts": ["tailwindcss"],
    };

    if (configDeps[filename]) {
      configDeps[filename].forEach((dep) => {
        this.usedDependencies.add(dep);
      });
    }

    // Also scan for require/import in config files
    this.extractImports(content);
  }

  /**
   * Extract package name from import path
   */
  extractPackageName(importPath) {
    if (importPath.startsWith("@")) {
      // Scoped package: @scope/package or @scope/package/subpath
      const parts = importPath.split("/");
      return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : null;
    } else {
      // Regular package: package or package/subpath
      return importPath.split("/")[0];
    }
  }

  /**
   * Analyze and report unused dependencies
   */
  analyze() {
    console.log("🔍 Analyzing dependencies...\n");

    // Scan all source files and configs
    this.scanSourceFiles();
    this.scanConfigFiles();

    // Add Next.js and React as they're always used
    this.usedDependencies.add("next");
    this.usedDependencies.add("react");
    this.usedDependencies.add("react-dom");

    // Add TypeScript and build tools that are always needed
    this.usedDependencies.add("typescript");
    this.usedDependencies.add("@types/node");
    this.usedDependencies.add("@types/react");
    this.usedDependencies.add("postcss");

    // Add types for packages we use
    if (this.usedDependencies.has("jszip")) {
      this.usedDependencies.add("@types/jszip");
    }

    // Check dependencies
    const allDeps = {
      ...this.packageJson.dependencies,
      ...this.packageJson.devDependencies,
    };

    const unusedDeps = [];
    const usedDeps = [];

    Object.keys(allDeps).forEach((dep) => {
      if (this.usedDependencies.has(dep)) {
        usedDeps.push(dep);
      } else {
        unusedDeps.push(dep);
      }
    });

    // Report results
    console.log(`✅ Used dependencies (${usedDeps.length}):`);
    usedDeps.sort().forEach((dep) => {
      console.log(`  - ${dep}`);
    });

    if (unusedDeps.length > 0) {
      console.log(`\n⚠️  Potentially unused dependencies (${unusedDeps.length}):`);
      unusedDeps.sort().forEach((dep) => {
        console.log(`  - ${dep}`);
      });

      console.log("\n💡 To remove unused dependencies:");
      console.log(`npm uninstall ${unusedDeps.join(" ")}`);
    } else {
      console.log("\n✨ No unused dependencies found!");
    }

    // Bundle size analysis
    console.log("\n📦 Bundle Analysis:");
    console.log("Run `npm run analyze` to analyze bundle size");

    return {
      used: usedDeps,
      unused: unusedDeps,
      total: Object.keys(allDeps).length,
    };
  }
}

// Run analysis if called directly
if (require.main === module) {
  const analyzer = new DependencyAnalyzer();
  analyzer.analyze();
}

module.exports = DependencyAnalyzer;
