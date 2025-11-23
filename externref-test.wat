(module
  ;; Simple externref test functions
  
  ;; Function that takes an externref and returns it (passthrough)
  (func $echo_externref (export "echo_externref") (param externref) (result externref)
    local.get 0
  )
  
  ;; Function that takes an externref and returns i32 (could check if null)
  (func $check_externref (export "check_externref") (param externref) (result i32)
    local.get 0
    ref.is_null
    if (result i32)
      i32.const 0  ;; null = 0
    else
      i32.const 1  ;; not null = 1
    end
  )
  
  ;; Function that returns null externref
  (func $get_null_externref (export "get_null_externref") (result externref)
    ref.null extern
  )
  
  ;; Simple function that doesn't use externref (for comparison)
  (func $add (export "add") (param i32 i32) (result i32)
    local.get 0
    local.get 1
    i32.add
  )
)