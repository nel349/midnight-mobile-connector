(module
  ;; Simple addition function for testing
  (func $add (param $a i32) (param $b i32) (result i32)
    local.get $a
    local.get $b
    i32.add
  )
  (export "add" (func $add))
  
  ;; Simple multiplication function  
  (func $multiply (param $a i32) (param $b i32) (result i32)
    local.get $a
    local.get $b
    i32.mul
  )
  (export "multiply" (func $multiply))
  
  ;; Constant function (no parameters)
  (func $getAnswer (result i32)
    i32.const 42
  )
  (export "getAnswer" (func $getAnswer))
)