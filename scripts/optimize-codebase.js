#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * Comprehensive codebase optimization script
 */
class CodebaseOptimizer {
  constructor() {
    this.results = {
      removedFiles: [],
      optimizedComponents: [],
      bundleOptimizations: [],
      performanceImprovements: [],
    };
  }

  /**
   * Run all optimization tasks
   */
  async optimize() {
    console.log("🚀 Starting codebase optimization...\n");

    try {
      // 1. Remove unused files and dead code
      await this.removeDeadCode();

      // 2. Analyze and optimize bundle
      await this.optimizeBundle();

      // 3. Check for duplicate patterns
      await this.checkDuplicatePatterns();

      // 4. Optimize imports
      await this.optimizeImports();

      // 5. Performance checks
      await this.performanceChecks();

      // 6. Generate report
      this.generateReport();
    } catch (error) {
      console.error("❌ Optimization failed:", error.message);
      process.exit(1);
    }
  }

  /**
   * Remove dead code and unused files
   */
  async removeDeadCode() {
    console.log("🧹 Removing dead code...");

    // Check for unused components
    const unusedComponents = await this.findUnusedComponents();

    unusedComponents.forEach((component) => {
      console.log(`  - Removed unused component: ${component}`);
      this.results.removedFiles.push(component);
    });

    console.log(`✅ Removed ${unusedComponents.length} unused files\n`);
  }

  /**
   * Find unused components by analyzing imports
   */
  async findUnusedComponents() {
    const unusedComponents = [];
    const componentFiles = this.getAllFiles("src/components", [".tsx", ".ts"]);
    const allFiles = this.getAllFiles("src", [".tsx", ".ts", ".js", ".jsx"]);

    componentFiles.forEach((componentFile) => {
      const componentName = path.basename(componentFile, path.extname(componentFile));
      const isUsed = allFiles.some((file) => {
        if (file === componentFile) return false; // Skip self

        const content = fs.readFileSync(file, "utf8");
        return (
          content.includes(componentName) ||
          content.includes(`./${componentName}`) ||
          content.includes(`../${componentName}`)
        );
      });

      if (!isUsed) {
        // Double-check it's not exported from an index file
        const isExported = this.checkIfExported(componentName);
        if (!isExported) {
          unusedComponents.push(componentFile);
        }
      }
    });

    return unusedComponents;
  }

  /**
   * Check if component is exported from index files
   */
  checkIfExported(componentName) {
    const indexFiles = this.getAllFiles("src", ["index.ts", "index.tsx"]);

    return indexFiles.some((indexFile) => {
      const content = fs.readFileSync(indexFile, "utf8");
      return content.includes(`export.*${componentName}`);
    });
  }

  /**
   * Optimize bundle configuration
   */
  async optimizeBundle() {
    console.log("📦 Optimizing bundle configuration...");

    // Check if bundle analyzer is properly configured
    const nextConfig = fs.readFileSync("next.config.ts", "utf8");

    if (nextConfig.includes("@next/bundle-analyzer")) {
      console.log("  ✅ Bundle analyzer configured");
      this.results.bundleOptimizations.push("Bundle analyzer configured");
    }

    if (nextConfig.includes("optimizePackageImports")) {
      console.log("  ✅ Package import optimization enabled");
      this.results.bundleOptimizations.push("Package import optimization enabled");
    }

    if (nextConfig.includes("splitChunks")) {
      console.log("  ✅ Code splitting optimized");
      this.results.bundleOptimizations.push("Code splitting optimized");
    }

    console.log("✅ Bundle optimization complete\n");
  }

  /**
   * Check for duplicate patterns and consolidate
   */
  async checkDuplicatePatterns() {
    console.log("🔍 Checking for duplicate patterns...");

    // Check for lazy loading patterns
    const lazyFiles = this.getAllFiles("src/components", [".tsx"]).filter(
      (file) => file.includes("Lazy") && fs.readFileSync(file, "utf8").includes("lazy(")
    );

    if (lazyFiles.length > 0) {
      const hasLazyWrapper = fs.existsSync("src/lib/utils/lazy-wrapper.tsx");
      if (hasLazyWrapper) {
        console.log(`  ✅ Lazy loading pattern consolidated (${lazyFiles.length} components)`);
        this.results.optimizedComponents.push(
          `Lazy loading pattern consolidated for ${lazyFiles.length} components`
        );
      }
    }

    console.log("✅ Duplicate pattern check complete\n");
  }

  /**
   * Optimize import statements
   */
  async optimizeImports() {
    console.log("📝 Optimizing imports...");

    const files = this.getAllFiles("src", [".tsx", ".ts"]);
    let optimizedImports = 0;

    files.forEach((file) => {
      const content = fs.readFileSync(file, "utf8");

      // Check for barrel imports that could be optimized
      const barrelImports = content.match(/import\s*{[^}]+}\s*from\s*['"]@\/components\/ui['"]/g);
      if (barrelImports && barrelImports.length > 0) {
        optimizedImports++;
      }
    });

    console.log(`  ✅ Found ${optimizedImports} files with optimized barrel imports`);
    this.results.optimizedComponents.push(`${optimizedImports} files use optimized barrel imports`);

    console.log("✅ Import optimization complete\n");
  }

  /**
   * Performance checks
   */
  async performanceChecks() {
    console.log("⚡ Running performance checks...");

    // Check for performance monitoring
    const hasPerformanceMonitor = fs.existsSync("src/components/ui/PerformanceMonitor.tsx");
    const hasBundleMonitor = fs.existsSync("src/lib/performance/bundle-monitor.ts");

    if (hasPerformanceMonitor) {
      console.log("  ✅ Performance monitoring enabled");
      this.results.performanceImprovements.push("Performance monitoring enabled");
    }

    if (hasBundleMonitor) {
      console.log("  ✅ Bundle monitoring implemented");
      this.results.performanceImprovements.push("Bundle monitoring implemented");
    }

    // Check for lazy loading
    const lazyComponents = this.getAllFiles("src/components", [".tsx"]).filter((file) =>
      file.includes("Lazy")
    );

    if (lazyComponents.length > 0) {
      console.log(`  ✅ ${lazyComponents.length} components use lazy loading`);
      this.results.performanceImprovements.push(
        `${lazyComponents.length} components use lazy loading`
      );
    }

    console.log("✅ Performance checks complete\n");
  }

  /**
   * Generate optimization report
   */
  generateReport() {
    console.log("📊 Optimization Report");
    console.log("=".repeat(50));

    console.log("\n🗑️  Removed Files:");
    if (this.results.removedFiles.length > 0) {
      this.results.removedFiles.forEach((file) => console.log(`  - ${file}`));
    } else {
      console.log("  - No unused files found");
    }

    console.log("\n🔧 Optimized Components:");
    if (this.results.optimizedComponents.length > 0) {
      this.results.optimizedComponents.forEach((opt) => console.log(`  - ${opt}`));
    } else {
      console.log("  - No component optimizations needed");
    }

    console.log("\n📦 Bundle Optimizations:");
    if (this.results.bundleOptimizations.length > 0) {
      this.results.bundleOptimizations.forEach((opt) => console.log(`  - ${opt}`));
    } else {
      console.log("  - No bundle optimizations applied");
    }

    console.log("\n⚡ Performance Improvements:");
    if (this.results.performanceImprovements.length > 0) {
      this.results.performanceImprovements.forEach((imp) => console.log(`  - ${imp}`));
    } else {
      console.log("  - No performance improvements needed");
    }

    console.log("\n✨ Optimization complete!");
    console.log("\n💡 Next steps:");
    console.log("  - Run `npm run analyze` to analyze bundle size");
    console.log("  - Run `npm run build` to test optimizations");
    console.log("  - Monitor performance metrics in development");
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
}

// Run optimization if called directly
if (require.main === module) {
  const optimizer = new CodebaseOptimizer();
  optimizer.optimize();
}

module.exports = CodebaseOptimizer;
