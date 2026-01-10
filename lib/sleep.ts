export function sleep(waitSec: number) {
    return new Promise<void>(function (resolve) {

        setTimeout(function() { resolve() }, waitSec);

    });
} 