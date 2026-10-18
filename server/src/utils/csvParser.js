const csvParser = require('csv-parser');
const fs = require('fs');
const { Readable } = require('stream');

/**
 * Parse CSV file from disk path or buffer into array of row objects
 * @param {string|Buffer} source - File path string or Buffer
 * @returns {Promise<Array<Object>>}
 */
const parseCSV = (source) => {
  return new Promise((resolve, reject) => {
    const results = [];
    let stream;

    if (Buffer.isBuffer(source)) {
      stream = Readable.from(source);
    } else if (typeof source === 'string') {
      stream = fs.createReadStream(source);
    } else {
      return reject(new Error('Invalid CSV source. Must be a filepath string or Buffer.'));
    }

    stream
      .pipe(csvParser({ trim: true, skipEmptyLines: true }))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
};

module.exports = {
  parseCSV
};
