const fs = require('fs'); // pull in the file system module
const path = require('path');

// MY VERSION
// Returns File Error Function
const fileError = (err, response) => {
  if (err) {
    if (err.code === 'ENOENT') {
      response.writeHead(404);
    }
    return response.end(err);
  }

  return null;
};

// Gets positions from range
const getPositions = (request) => {
  let { range } = request.headers;

  if (!range) {
    range = 'bytes=0-';
  }

  return range.replace(/bytes=/, '').split('-');
};

// // Writes response head
const responseWriteHead = (response, chunksize, start, end, total, contentType) => {
  response.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${total}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunksize,
    'Content-Type': contentType,
  });
};

// // reads and returns stream
const readStream = (file, response, start, end) => {
  const stream = fs.createReadStream(file, { start, end });

  stream.on('open', () => {
    stream.pipe(response);
  });

  stream.on('error', (streamErr) => {
    response.end(streamErr);
  });

  return stream;
};

const loadFile = (request, response, filePath, contentType) => {
  const file = path.resolve(__dirname, filePath);

  fs.stat(file, (err, stats) => {
    fileError(err, response);

    // Calculates start, total, end, chunksize
    const positions = getPositions(request);
    let start = parseInt(positions[0], 10);
    const total = stats.size;
    const end = positions[1] ? parseInt(positions[1], 10) : total - 1;
    if (start > end) {
      start = end - 1;
    }
    const chunksize = (end - start) + 1;

    responseWriteHead(response, chunksize, start, end, total, contentType);

    return readStream(file, response, start, end);
  });
};

module.exports.loadFile = loadFile;


// OLD STUFF
// const getParty = (request, response) => {
//   const file = path.resolve(__dirname, '../client/party.mp4');

//   fs.stat(file, (err, stats) => {
//     if (err) {
//       if (err.code === 'ENOENT') {
//         response.writeHead(404);
//       }
//       return response.end(err);
//     }

//     let { range } = request.headers;

//     if (!range) {
//       range = 'bytes=0-';
//     }

//     const positions = range.replace(/bytes=/, '').split('-');

//     let start = parseInt(positions[0], 10);

//     const total = stats.size;
//     const end = positions[1] ? parseInt(positions[1], 10) : total - 1;

//     if (start > end) {
//       start = end - 1;
//     }

//     const chunksize = (end - start) + 1;

//     response.writeHead(206, {
//       'Content-Range': `bytes ${start}-${end}/${total}`,
//       'Accept-Ranges': 'bytes',
//       'Content-Length': chunksize,
//       'Content-Type': 'video/mp4',
//     });

//     const stream = fs.createReadStream(file, { start, end });

//     stream.on('open', () => {
//       stream.pipe(response);
//     });

//     stream.on('error', (streamErr) => {
//       response.end(streamErr);
//     });

//     return stream;
//   });
// };

// module.exports.getParty = getParty;
