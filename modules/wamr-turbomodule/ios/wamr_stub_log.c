#include "../wamr/core/shared/utils/bh_log.h"
#include <stdarg.h>

// Minimal stub implementations for WAMR logging functions
void bh_log_set_verbose_level(uint32 level) {
    // Do nothing for now
}

void bh_log(LogLevel log_level, const char *file, int line, const char *fmt, ...) {
    // For debug builds, we could print to NSLog if needed
    // For now, just ignore all log calls
}

void bh_print_time(const char *prompt) {
    // Stub - do nothing
}