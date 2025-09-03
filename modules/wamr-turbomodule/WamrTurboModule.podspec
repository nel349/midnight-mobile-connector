require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "WamrTurboModule"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://github.com/midnight-ntwrk/wamr-turbomodule"
  s.license      = "MIT"
  s.authors      = { "Midnight Network" => "dev@midnight.network" }

  s.platforms    = { :ios => "15.1" }
  s.source       = { :git => ".", :tag => "#{s.version}" }

  # TurboModule and WAMR source files
  s.source_files = [
    "ios/**/*.{h,hpp,cpp,mm}",
    "wamr/core/iwasm/include/*.h",
    "wamr/core/iwasm/interpreter/**/*.{h,c}",
    "wamr/core/iwasm/common/**/*.{h,c}",
    "wamr/core/shared/mem-alloc/**/*.{h,c}",
    "wamr/core/shared/utils/**/*.{h,c}",
    "wamr/core/shared/platform/common/posix/**/*.{h,c}",
    "wamr/core/shared/platform/darwin/**/*.{h,c}"
  ]
  
  s.header_dir = "WamrTurboModule"
  
  s.pod_target_xcconfig = {
    "USE_HEADERMAP" => "YES",
    "HEADER_SEARCH_PATHS" => [
      "$(PODS_TARGET_SRCROOT)/wamr/core/iwasm/include",
      "$(PODS_TARGET_SRCROOT)/wamr/core/iwasm/interpreter",
      "$(PODS_TARGET_SRCROOT)/wamr/core/iwasm/common",
      "$(PODS_TARGET_SRCROOT)/wamr/core/shared/include",
      "$(PODS_TARGET_SRCROOT)/wamr/core/shared/platform/include"
    ].join(" "),
    "GCC_PREPROCESSOR_DEFINITIONS" => [
      "BH_PLATFORM_DARWIN=1",
      "WASM_ENABLE_INTERP=1",
      "WASM_ENABLE_FAST_INTERP=0", 
      "WASM_ENABLE_REF_TYPES=1",
      "WASM_ENABLE_BULK_MEMORY=1"
    ].join(" ")
  }

  s.dependency "React-Core"
  s.dependency "ReactCommon/turbomodule/core"
  
  install_modules_dependencies(s)
end