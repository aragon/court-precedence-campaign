const { script: { acl, app, entity, role } } = require('./metadata')
const { encodeCallsScript, encodeGrantPermission } = require('../../../helpers/lib/encoder')

module.exports = async () => {
  const data = encodeGrantPermission(entity, app, role)
  return encodeCallsScript([{ to: acl, data: data }])
}
