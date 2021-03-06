exports.TIMEOUT = TIMEOUT = 10000;
//TODO: send callbacks and timeouts need to clear socket message map entries
exports.MAX_BODY_SIZE = 498;

// CELL-LEVEL COMMANDS
exports.CREATE = CREATE = 1;
exports.CREATED = CREATED = 2;
exports.RELAY = RELAY = 3;
exports.DESTROY = DESTROY = 4;
exports.OPEN = OPEN = 5;
exports.OPENED = OPENED = 6;
exports.OPEN_FAILED = OPEN_FAILED = 7;
exports.CREATE_FAILED = CREATE_FAILED = 8;

// RELAY COMMANDS
exports.RELAY_BEGIN = RELAY_BEGIN = 1;
exports.RELAY_DATA = RELAY_DATA = 2;
exports.RELAY_END = RELAY_END = 3;
exports.RELAY_CONNECTED = RELAY_CONNECTED = 4;
exports.RELAY_EXTEND = RELAY_EXTEND = 6;
exports.RELAY_EXTENDED = RELAY_EXTENDED = 7;
exports.RELAY_BEGIN_FAILED  = RELAY_BEGIN_FAILED = 11;
exports.RELAY_EXTEND_FAILED = RELAY_EXTEND_FAILED = 12;

function packMainFields(circuit_id, command, message_buffer) {
    message_buffer = message_buffer || new Buffer(512);
    message_buffer.fill(0);

    message_buffer.writeUInt16BE(circuit_id, 0);
    message_buffer.writeUInt8(command, 2);

    message_buffer.fill(0, 3);

    return message_buffer;
}

exports.unpackMainFields = function(message_buffer) {
    _circuit_id = message_buffer.readUInt16BE(0);
    _cell_type = message_buffer.readUInt8(2);
    return {
        circuit_id: _circuit_id,
        cell_type: _cell_type
    }
}

exports.unpack = function(command, message_buffer) {
  switch(command) {
    case OPEN:
      return exports.unpackOpen(message_buffer);
    case OPENED:
      return exports.unpackOpened(message_buffer);
    case OPEN_FAILED:
      return exports.unpackOpenFailed(message_buffer);
    case RELAY:
      return exports.unpackRelay(message_buffer);
    default:
      return {};
  }
}

function packCreate(circuit_id) {
    return packMainFields(circuit_id, CREATE);
}

exports.sendCreate = function(res, rej, socket, circuit_id) {
    // console.log("in send create");
    cell = packCreate(circuit_id);
    // console.log("packed with ID" + circuit_id);
    if (socket == null) {
        console.log("Trying to send CREATE " + circuit_id + " but socket no longer exists.");
        return;
    }
    socket.msgMap[CREATE][circuit_id] = {resolve: res, reject: rej, timeout: setTimeout(function(){console.log("timeout");rej();}, TIMEOUT)};
    //console.log(socket.UUID);
    //console.log(socket.msgMap);
    //console.log("added msg Map for create");
    socket.write(cell);
    //console.log("sent message");
    console.log(">>> Sent CREATE " + circuit_id);
}

function packCreated(circuit_id) {
    return packMainFields(circuit_id, CREATED);
}

exports.sendCreated = function(socket, circuit_id) {
    if (socket == null) {
        console.log("Trying to send CREATED " + circuit_id + " but socket no longer exists.");
        return;
    }

    cell = packCreated(circuit_id);
    socket.write(cell);
    console.log(">>> Sent CREATED " + circuit_id);
}

function packDestroy(circuit_id) {
    return packMainFields(circuit_id, DESTROY);
}

exports.sendDestroy = function(socket, circuit_id) {
    if (socket == null) {
        console.log("Trying to send DESTROY " + circuit_id + " but socket no longer exists.");
        return;
    }
    cell = packDestroy(circuit_id);
    socket.write(cell);
    console.log(">>> Sent DESTROY " + circuit_id);
}

function packOpen(sender_id, receiver_id) {
    message_buffer = new Buffer(512);
    message_buffer.fill(0);
    message_buffer = packMainFields(0, OPEN, message_buffer);

    message_buffer.writeUInt32BE(sender_id, 3);
    message_buffer.writeUInt32BE(receiver_id, 7);

    return message_buffer;
}

exports.sendOpen = function(res, rej, socket, opener_id, opened_id) {
    if (socket == null) {
        console.log("Trying to send OPEN to " + opened_id + " but socket no longer exists.");
        return;
    }

    cell = packOpen(opener_id, opened_id);
    //console.log(socket.msgMap);
    socket.msgMap[OPEN] = {resolve: res, reject: rej, timeout: setTimeout(function(){console.log("timeout");rej();}, TIMEOUT)};
    //console.log(socket.msgMap);
    //console.log("ADDED TO MAP");
    socket.write(cell);
    console.log(">>> Sent OPEN " + opened_id);
}

exports.unpackOpen = function(message_buffer) {
    var msg = unpackMainFields(message_buffer);
    msg.opener_id = message_buffer.readUInt32BE(3);
    msg.opened_id = message_buffer.readUInt32BE(7);
    return msg;
}

function packOpened(opener_id, opened_id) {
    message_buffer = new Buffer(512);
    message_buffer.fill(0);
    message_buffer = packMainFields(0, OPENED, message_buffer);

    // Same as an open, so ids should stay in same order
    message_buffer.writeUInt32BE(opener_id, 3);
    message_buffer.writeUInt32BE(opened_id, 7);

    return message_buffer;
}

exports.sendOpened = function(socket, opener_id, opened_id) {
    if (socket == null) {
        console.log("Trying to send OPENED to " + opener_id + " but socket no longer exists.");
        return;
    }

    cell = packOpened(opener_id, opened_id);
    socket.write(cell);
    console.log(">>> Sent OPENED " + opener_id);
}

exports.unpackOpened = function(message_buffer) {
    return exports.unpackOpen(message_buffer);
}

function packOpenFailed(sender_id, receiver_id) {
    message_buffer = new Buffer(512);
    message_buffer.fill(0);
    message_buffer = packMainFields(0, OPEN_FAILED, message_buffer);

    // Same as an open, so ids should stay in same order
    message_buffer.writeUInt32BE(receiver_id, 3);
    message_buffer.writeUInt32BE(sender_id, 7);

    return message_buffer;
}

exports.sendOpenFailed = function(socket, sender_id, receiver_id) {
    if (socket == null) {
        console.log("Trying to send OPEN_FAILED to " + sender_id + " but socket no longer exists.");
        return;
    }

    cell = packOpenFailed(sender_id, receiver_id);
    socket.write(cell);
    console.log(">>> Sent OPEN_FAILED " + sender_id);
}

exports.unpackOpenFailed = function(message_buffer) {
    return exports.unpackOpen(message_buffer);
}

function packCreateFailed(circuit_id) {
    return packMainFields(circuit_id, CREATE_FAILED);
}

exports.sendCreateFailed = function(socket, circuit_id) {
    if (socket == null) {
        console.log("Trying to send CREATE_FAILED " + circuit_id + " but socket no longer exists.");
        return;
    }

    cell = packCreateFailed(circuit_id);
    socket.write(cell);
    console.log(">>> Sent CREATE_FAILED " + circuit_id);
}

// Body parameter should be a buffer.
function packRelay(circuit_id, stream_id, relay_command, body) {
    var body_length;
    if (body == null) {body_length = 0;
    } else { body_length = body.length; }
    message_buffer = new Buffer(512);
    message_buffer.fill(0);
    message_buffer = packMainFields(circuit_id, RELAY, message_buffer);
    message_buffer.writeUInt16BE(stream_id, 3);
    message_buffer.writeUInt16BE(0, 5); // Empty here. Don't know why.
    message_buffer.writeUInt32BE(0, 7); // Digest would go here.
    message_buffer.writeUInt16BE(body_length, 11);
    message_buffer.writeUInt8(relay_command, 13);
    // Copy body over to message buffer
    if (body != null) {
      temp = body.copy(message_buffer, 14, 0, body.length);
    }
    return message_buffer;
}

exports.sendRelay = function(res, rej, socket, circuit_id, stream_id, relay_command, body) {
    if (socket == null) {
        console.log("Trying to send RELAY " + relay_command + " on " + circuit_id + " but socket no longer exists.");
        return;
    }

  // console.log("in relay" + relay_command);
  var cell = packRelay(circuit_id, stream_id, relay_command, body);
  //console.log("packed relay");
  if (rej || res) {
    //console.log("adding mappings");
    var data = {resolve: res, reject: rej};
    //console.log("added resrej");
    data["timeout"] = setTimeout(function(){console.log("TIMEOUT");rej();}, TIMEOUT);
    //console.log("added timeout to data");
    //console.log(socket.msgMap);
    //console.log(socket.msgMap[RELAY]);
    //console.log(relay_command);
    // console.log(socket);
    socket.msgMap[RELAY][relay_command][stream_id] = data;//{resolve: res, reject: rej, timeout:setTimeout(function(){rej();}, TIMEOUT)};
  }
  //console.log("added mappings");
  // console.log("Writing relay cell to socket");
  socket.write(cell);
  console.log(">>> Sent RELAY " + relay_command + " on circuit " + circuit_id);
}

exports.unpackRelay = function(message_buffer) {
    var msg = unpackMainFields(message_buffer);

    msg.stream_id = message_buffer.readUInt16BE(3);
    msg.body_length = message_buffer.readUInt16BE(11);
    msg.relay_command = message_buffer.readUInt8(13);
    msg.body = message_buffer.slice(14, 14 + msg.body_length);

    return msg;
}

exports.parseNodeAddr = function(message_buffer) {
  ret = {};
  // TODO: determine encoding
  var addr = message_buffer.toString(undefined, 0, message_buffer.length-5);
  ret["agent_id"] = message_buffer.readUInt32BE(message_buffer.length-4);
  var addrSplit = addr.split(":");
  ret["ip"] = addrSplit[0];
  ret["port"] = addrSplit[1].split('\0')[0];
  return ret;
}

Object.freeze(exports);
