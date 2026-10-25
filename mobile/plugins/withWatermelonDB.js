const { withAppBuildGradle, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * WatermelonDB config plugin for Expo
 * Links the WatermelonDB native module for JSI support (Android only)
 */
const withWatermelonDB = (config) => {
  // Android: Add the android-jsi module to the build
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let contents = config.modResults.contents;
      
      // Add the watermelondb-android-jsi project
      if (!contents.includes("watermelondb-android-jsi")) {
        contents = contents.replace(
          /dependencies\s*{/,
          `dependencies {\n    implementation project(':watermelondb-android-jsi')`
        );
      }
      
      config.modResults.contents = contents;
    }
    return config;
  });

  // Android: Add the watermelondb-android-jsi to settings.gradle
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const settingsGradlePath = path.join(config.modRequest.platformProjectRoot, 'settings.gradle');
      if (fs.existsSync(settingsGradlePath)) {
        let contents = fs.readFileSync(settingsGradlePath, 'utf8');
        
        if (!contents.includes("watermelondb-android-jsi")) {
          // Add the project include
          contents = contents.replace(
            /include\s*':app'/,
            `include ':watermelondb-android-jsi'\nproject(':watermelondb-android-jsi').projectDir = new File(rootProject.projectDir, '../node_modules/@nozbe/watermelondb/native/android-jsi')\ninclude ':app'`
          );
        }
        
        fs.writeFileSync(settingsGradlePath, contents);
      }
      return config;
    },
  ]);

  // Android: Add JSI initialization to MainApplication (supports both .java and .kt)
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const mainApplicationPaths = [
        path.join(config.modRequest.platformProjectRoot, 'app/src/main/java/com/cuidapp/app/MainApplication.java'),
        path.join(config.modRequest.platformProjectRoot, 'app/src/main/java/com/cuidapp/app/MainApplication.kt'),
      ];
      
      for (const mainApplicationPath of mainApplicationPaths) {
        if (fs.existsSync(mainApplicationPath)) {
          let contents = fs.readFileSync(mainApplicationPath, 'utf8');
          
          // Add WatermelonDB JSI package import
          if (!contents.includes('WatermelonDBJSIPackage')) {
            // Handle Java import
            if (contents.includes('import com.nozbe.watermelondb.WatermelonDBPackage;')) {
              contents = contents.replace(
                /import com\.nozbe\.watermelondb\.WatermelonDBPackage;/,
                `import com.nozbe.watermelondb.WatermelonDBPackage;\nimport com.nozbe.watermelondb.jsi.WatermelonDBJSIPackage;`
              );
            }
            // Handle Kotlin import
            else if (contents.includes('import com.nozbe.watermelondb.WatermelonDBPackage')) {
              contents = contents.replace(
                /import com\.nozbe\.watermelondb\.WatermelonDBPackage/,
                `import com.nozbe.watermelondb.WatermelonDBPackage\nimport com.nozbe.watermelondb.jsi.WatermelonDBJSIPackage`
              );
            }
            
            // Add the JSI package to the packages list (Java style)
            if (contents.includes('new WatermelonDBPackage(),')) {
              contents = contents.replace(
                /new WatermelonDBPackage\(\),/,
                `new WatermelonDBPackage(),\n            new WatermelonDBJSIPackage(),`
              );
            }
            // Add the JSI package to the packages list (Kotlin style)
            else if (contents.includes('PackageList(this).packages.apply')) {
              contents = contents.replace(
                /PackageList\(this\)\.packages\.apply\s*{/,
                `PackageList(this).packages.apply {\n            add(com.nozbe.watermelondb.jsi.WatermelonDBJSIPackage())\n          }`
              );
            }
          }
          
          fs.writeFileSync(mainApplicationPath, contents);
        }
      }
      return config;
    },
  ]);

  return config;
};

module.exports = withWatermelonDB;