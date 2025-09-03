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

  # TurboModule and WAMR core files only (minimal set for proof of concept)
  s.source_files = [
    "ios/**/*.{h,hpp,cpp,mm,c}",
    "wamr/core/iwasm/include/*.h",
    "wamr/core/shared/platform/include/*.h",
    "wamr/core/iwasm/interpreter/wasm_mini_loader.c",
    "wamr/core/iwasm/interpreter/wasm_loader.c", 
    "wamr/core/iwasm/interpreter/wasm_runtime.c",
    "wamr/core/iwasm/interpreter/wasm_interp_classic.c",
    "wamr/core/iwasm/common/arch/*.c",
    "wamr/core/iwasm/common/wasm_exec_env.c",
    "wamr/core/iwasm/common/wasm_shared_memory.c",
    "wamr/core/iwasm/common/wasm_memory.c",
    "wamr/core/iwasm/common/wasm_blocking_op.c",
    "wamr/core/iwasm/common/wasm_native.c",
    "wamr/core/iwasm/common/wasm_runtime_common.c",
    "wamr/core/iwasm/common/wasm_loader_common.c",
    "wamr/core/iwasm/common/wasm_application.c",
    "wamr/core/shared/mem-alloc/mem_alloc.c",
    "wamr/core/shared/mem-alloc/ems/*.c",
    "wamr/core/shared/utils/bh_assert.c",
    "wamr/core/shared/utils/bh_vector.c", 
    "wamr/core/shared/utils/bh_bitmap.c",
    "wamr/core/shared/utils/bh_queue.c",
    "wamr/core/shared/utils/bh_list.c",
    "wamr/core/shared/utils/bh_common.c",
    "wamr/core/shared/utils/bh_hashmap.c",
    "wamr/core/shared/utils/bh_leb128.c",
    "wamr/core/shared/platform/darwin/*.c",
    "wamr/core/shared/platform/common/posix/posix_time.c",
    "wamr/core/shared/platform/common/posix/posix_malloc.c",
    "wamr/core/shared/platform/common/posix/posix_memmap.c",
    "wamr/core/shared/platform/common/posix/posix_thread.c",
    "wamr/core/shared/platform/common/posix/posix_blocking_op.c",
    "wamr/core/shared/platform/common/memory/mremap.c"
  ]
  
  s.header_dir = "WamrTurboModule"
  
  s.pod_target_xcconfig = {
    "USE_HEADERMAP" => "YES",
    "HEADER_SEARCH_PATHS" => [
      "$(PODS_TARGET_SRCROOT)/wamr/core/iwasm/include",
      "$(PODS_TARGET_SRCROOT)/wamr/core/iwasm/interpreter",
      "$(PODS_TARGET_SRCROOT)/wamr/core/iwasm/common",
      "$(PODS_TARGET_SRCROOT)/wamr/core/iwasm/libraries",
      "$(PODS_TARGET_SRCROOT)/wamr/core/shared/include",
      "$(PODS_TARGET_SRCROOT)/wamr/core/shared/mem-alloc",
      "$(PODS_TARGET_SRCROOT)/wamr/core/shared/mem-alloc/ems",
      "$(PODS_TARGET_SRCROOT)/wamr/core/shared/utils",
      "$(PODS_TARGET_SRCROOT)/wamr/core/shared/platform/include",
      "$(PODS_TARGET_SRCROOT)/wamr/core/shared/platform/darwin",
      "$(PODS_TARGET_SRCROOT)/wamr/core/shared/platform/common/posix",
      "$(PODS_TARGET_SRCROOT)/wamr/core/shared/platform/common/memory"
    ].join(" "),
    "GCC_PREPROCESSOR_DEFINITIONS" => [
      "BH_PLATFORM_DARWIN=1",
      "WASM_ENABLE_INTERP=1",
      "WASM_ENABLE_FAST_INTERP=0", 
      "WASM_ENABLE_MINI_LOADER=1",
      "WASM_ENABLE_BULK_MEMORY=1",
      "WASM_ENABLE_GC=0",
      "WASM_ENABLE_STRINGREF=0",
      "WASM_ENABLE_WAMR_COMPILER=0",
      "BH_MALLOC=wasm_runtime_malloc",
      "BH_FREE=wasm_runtime_free"
    ].join(" "),
    "OTHER_LDFLAGS" => "-ObjC"
  }

  s.dependency "React-Core"
  s.dependency "ReactCommon/turbomodule/core"
  
  install_modules_dependencies(s)
end