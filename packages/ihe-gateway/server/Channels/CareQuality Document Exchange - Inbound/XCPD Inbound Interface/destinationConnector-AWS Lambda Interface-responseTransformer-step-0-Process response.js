var payload = channelMap.get('PRPA_IN201305UV02');

var soapTemplate = getSOAPTemplate();
var soap = soapTemplate.namespace('soap');
var wsa = soapTemplate.namespace('wsa');
soapTemplate.soap::Header.wsa::Action = 'urn:hl7-org:v3:PRPA_IN201306UV02:CrossGatewayPatientDiscovery';
soapTemplate.soap::Header.wsa::RelatesTo = 'urn:uuid:' + channelMap.get('MSG_ID');