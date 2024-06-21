const im = require("imagemagick");

export const resize = (srcPath, dstPath, width, height) => {
    return new Promise((resolve, reject) =>
        im.resize({ srcPath, dstPath, width, height }, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(dstPath);
            }
        })
    );
};
