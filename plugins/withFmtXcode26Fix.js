const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withFmtXcode26Fix = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');

      const marker = '# fmt Xcode 26 consteval patch';
      if (contents.includes(marker)) {
        return config;
      }

      const patch = `
    ${marker}
    installer.pods_project.targets.each do |target|
      if target.name == 'fmt'
        target.build_configurations.each do |config|
          config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
        end
      end
    end
`;

      // Insert AFTER the closing ) of react_native_post_install(...)
      // The call ends with a line that is just "    )"
      contents = contents.replace(
        /(react_native_post_install\([\s\S]*?\n\s*\))/,
        `$1\n${patch}`
      );

      fs.writeFileSync(podfilePath, contents);
      return config;
    },
  ]);
};

module.exports = withFmtXcode26Fix;
