const {
  script: { acl, app, entity, manager, role },
} = require('./metadata')
const {
  encodeCallsScript,
  encodeCreatePermission,
} = require('../../lib/encoder')

module.exports = async () => {
  const data = encodeCreatePermission(entity, app, role, manager)
  return encodeCallsScript([{ to: acl, data: data }])
}
