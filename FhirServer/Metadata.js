import { get, has } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import moment from 'moment';

let fhirPath = get(Meteor, 'settings.private.fhir.fhirPath');

import jwt from 'jsonwebtoken';


let defaultInteractions = [{
  "code": "read"
}];

let defaultSearchParams = [
  {
    "name": "_id",
    "type": "token",
    "documentation": "_id parameter always supported."
  },
  {
    "name": "identifier",
    "type": "token",
    "documentation": "this should be the medical record number"
  }]

const Server = {
  getCapabilityStatement: function(){
    var CapabilityStatement = {
      "resourceType": "CapabilityStatement",
      "url": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.fhirPath'),
      "name": get(Meteor, 'settings.public.title'),
      "version": get(Meteor, 'settings.public.version'),
      "status": "draft",
      "experimental": true,
      "publisher": "Symptomatic, LLC",
      "kind": "capability",
      "date": new Date(),
      "contact": get(Meteor, 'settings.public.contact'),
      "software": {
        "version" : "6.1.0",
        "name" : "Vault Server",
        "releaseDate" : new Date()
      },
      "fhirVersion": get(Meteor, 'settings.public.fhirVersion'),
      "format": [
        "json"
      ],
      "rest": [{
          "mode": "server",
          "resource": []
      }]
    };

    // let oAuthServerRunning = false;
    // if(oAuthServerRunning){
    //   CapabilityStatement.security = {
    //     "service": [],
    //   };
    // }


    if(get(Meteor, 'settings.private.fhir.disableOauth') !== true){
      CapabilityStatement.rest[0].security = {
        "service": [],
        "extension": []
      };
      CapabilityStatement.rest[0].security.service.push({
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/restful-security-service",
            "code": "SMART-on-FHIR"
          }
        ],
        "text": "OAuth2 using SMART-on-FHIR profile (see http://docs.smarthealthit.org)"
      })

      

      CapabilityStatement.rest[0].security.extension.push({
        "extension": [
          {
            "url": "token",
            "valueUri": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.tokenEndpoint', "oauth/token") 
          },
          {
            "url": "authorize",
            "valueUri": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.authorizationEndpoint', "oauth/authorize") 
          },
          {
            "url": "register",
            "valueUri": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.registrationEndpoint', "oauth/registration") 
          },
          {
            "url": "manage",
            "valueUri": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.manageEndpoint', "authorizations/manage")
          },
          {
            "url": "introspect",
            "valueUri": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.introspectEndpoint', "authorizations/introspect")
          },
          {
            "url": "revoke",
            "valueUri": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.revokeEndpoint', "authorizations/revoke")
          }
        ],
        "url": "http://fhir-registry.smarthealthit.org/StructureDefinition/oauth-uris"
      })
    }
    
    if (has(Meteor, 'settings.private.fhir.rest')) {
      Object.keys(Meteor.settings.private.fhir.rest).forEach(function(key){
        let newResourceStatement = {
          "type": key,
          "interaction": defaultInteractions,
          "versioning": "no-version"
          // "readHistory": false,
          // "updateCreate": false,
          // "conditionalCreate": false,
          // "conditionalUpdate": false,
          // "conditionalDelete": "not-supported"
          // "searchParam": defaultSearchParams
        }

        if (Array.isArray(Meteor.settings.private.fhir.rest[key].interactions)) {
          newResourceStatement.interaction = [];
          Meteor.settings.private.fhir.rest[key].interactions.forEach(function(item){
            newResourceStatement.interaction.push({
              "code": item
            })
            newResourceStatement.versioning = get(Meteor, 'settings.private.fhir.rest[' + key + '].versioning', "no-version")
          })
        }

        if (Array.isArray(Meteor.settings.private.fhir.rest[key].interactions)) {
          newResourceStatement.interaction = [];
          Meteor.settings.private.fhir.rest[key].interactions.forEach(function(item){
            newResourceStatement.interaction.push({
              "code": item
            })
            newResourceStatement.versioning = get(Meteor, 'settings.private.fhir.rest[' + key + '].versioning', "no-version")
          })
        }


        CapabilityStatement.rest[0].resource.push(newResourceStatement);
      })      
    }
    return CapabilityStatement;
  },
  getWellKnownSmartConfiguration: function(){
    let response = {
      "resourceType": "Basic",
      
      // required fields
      "authorization_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.authorizationEndpoint', "oauth/authorize"),
      "token_endpoint":  Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.tokenEndpoint', "oauth/token") ,
      "capabilities": "http://localhost:3000/",

      // optional fields
      "scopes_supported": "",
      "response_types_supported": "",
      "management_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.revokeEndpoint', "authorizations/manage"),
      "introspection_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.revokeEndpoint', "authorizations/introspect"),
      "registration_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.registrationEndpoint', "oauth/registration"),
      "revocation_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.revokeEndpoint', "authorizations/revoke"),

      // custom fields
      "message": "smart config!"
    }

    return response;
  },
  getWellKnownUdapConfiguration: function(){
    let response = {
      "resourceType": "Basic",
      "x5c": [],      
      "udap_versions_supported": ["1"],
      "udap_certifications_supported": ["https://vhdir.meteorapp.com/udap/profiles/example-certification"],
      "udap_certifications_required": ["https://vhdir.meteorapp.com/udap/profiles/example-certification"],
      "grant_types_supported": ["authorization_code", "refresh_token",  "client_credentials"],
      "scopes_supported": ["openid", "launch/patient"],
      "authorization_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.authorizationEndpoint', "oauth/authorize"),
      "token_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.tokenEndpoint', "oauth/token"),
      "token_endpoint_auth_methods_supported": ["private_key_jwt"],
      "token_endpoint_auth_signing_alg_values_supported": ["RS256", "ES384"],

      "registration_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.registrationEndpoint', "oauth/registration"),
      "registration_endpoint_jwt_signing_alg_values_supported": ["RS256", "ES384"],
      "signed_metadata": null,
      "raw_metadata": {
        "iss": Meteor.absoluteUrl(),
        "sub": Meteor.absoluteUrl(),
        "exp": moment().unix(),
        "iat": moment().unix(),
        "jti": "random-value-" + Random.id(),
        "authorization_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.authorizationEndpoint', "oauth/authorize"),
        "token_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.tokenEndpoint', "oauth/token"),
        "registration_endpoint": Meteor.absoluteUrl() + get(Meteor, 'settings.private.fhir.security.registrationEndpoint', "oauth/registration")
      }
    }

    let fhirRestEndpoints = get(Meteor, 'settings.private.fhir.rest');
    if(fhirRestEndpoints){
      Object.keys(fhirRestEndpoints).forEach(function(key){
        response.scopes_supported.push("system/" + key + ".read")
      })
    }

    let x509publicKey = get(Meteor, 'settings.private.x509.publicKey');
    console.log('x509publicKey', x509publicKey)
    response.x5c.push(x509publicKey)



    return response;
  }
}

Meteor.startup(function() {
  console.log('========================================================================');
  console.log('Generating CapabilityStatement of current configuration...');
  console.log(Server.getCapabilityStatement());
  console.log('========================================================================');

  JsonRoutes.add("get", fhirPath + "/metadata", function (req, res, next) {
    console.log('GET ' + fhirPath + '/metadata');

    res.setHeader('Content-type', 'application/json');
    res.setHeader("Access-Control-Allow-Origin", "*");

    let returnPayload = {
      code: 200,
      data: Server.getCapabilityStatement()
    }
    if(process.env.TRACE){
      console.log('return payload', returnPayload);
    }
   
    JsonRoutes.sendResult(res, returnPayload);
  });

  JsonRoutes.add("get", "/metadata", function (req, res, next) {
    console.log('GET ' + '/metadata');

    res.setHeader('Content-type', 'application/json');
    res.setHeader("Access-Control-Allow-Origin", "*");

    let returnPayload = {
      code: 200,
      data: Server.getCapabilityStatement()
    }
    if(process.env.TRACE){
      console.log('return payload', returnPayload);
    }
   
    JsonRoutes.sendResult(res, returnPayload);
  });


  JsonRoutes.add("get", "/.well-known/smart-configuration", function (req, res, next) {
    console.log('========================================================================');

    console.log('GET ' + '/.well-known/smart-configuration');

    res.setHeader('Content-type', 'application/json');
    res.setHeader("Access-Control-Allow-Origin", "*");

    let returnPayload = {
      code: 200,
      data: Server.getWellKnownSmartConfiguration()
    }
    if(process.env.TRACE){
      console.log('return payload', returnPayload);
    }
   
    JsonRoutes.sendResult(res, returnPayload);
  });

  JsonRoutes.add("get", fhirPath + "/.well-known/udap", function (req, res, next) {
    console.log('========================================================================');

    console.log('GET ' + fhirPath + '/.well-known/udap');

    res.setHeader('Content-type', 'application/json');
    res.setHeader("Access-Control-Allow-Origin", "*");

    let returnPayload = {
      code: 200,
      data: Server.getWellKnownUdapConfiguration()
    }
    if(process.env.TRACE){
      console.log('return payload', returnPayload);
    }
   
    JsonRoutes.sendResult(res, returnPayload);
  });

  JsonRoutes.add("get", "/.well-known/udap", function (req, res, next) {
    console.log('========================================================================');

    console.log('GET ' + '/.well-known/udap');

    res.setHeader('Content-type', 'application/json');
    res.setHeader("Access-Control-Allow-Origin", "*");

    let returnPayload = {
      code: 200,
      data: Server.getWellKnownUdapConfiguration()
    }
    if(process.env.TRACE){
      console.log('return payload', returnPayload);
    }
   
    JsonRoutes.sendResult(res, returnPayload);
  });




  JsonRoutes.add("post", "/oauth/registration", function (req, res, next) {
    console.log('========================================================================');
    console.log('POST ' + '/oauth/registration');

    res.setHeader('Content-type', 'application/json');
    res.setHeader("Access-Control-Allow-Origin", "*");

    console.log("")
    console.log(req.body)
    console.log("")

    let softwareStatement = get(req, 'body.software_statement');
    let decodedSoftwareStatement = jwt.decode(softwareStatement);

    console.log('decodedSoftwareStatement', decodedSoftwareStatement);

    // couldn't find the registration
    if(!OAuthClients.findOne({client_name: get(decodedSoftwareStatement, 'client_name')})){

      // let newRecord = Object.assign({}, req.body);
      // newRecord.createdAt = new Date();
      // newRecord.active = true;
      
      // UDAP 
      let newRecord = Object.assign({
        "software_statement": softwareStatement
      }, decodedSoftwareStatement);

      let clientId = OAuthClients.insert(newRecord);
      console.log('clientId', clientId)

      let dataPayload = {
        "client_id": clientId,
        "software_statement": softwareStatement
      }

      if(get(req, 'body.scope'))
        dataPayload.scope = encodeURIComponent(get(req, 'body.scope'));
      }

      if(get(decodedSoftwareStatement, 'client_name')){
        dataPayload.client_name = get(decodedSoftwareStatement, 'client_name');
      }
      if(get(decodedSoftwareStatement, 'redirect_uris')){
        dataPayload.client_name = [get(decodedSoftwareStatement, 'redirect_uris')];
      }
      if(get(decodedSoftwareStatement, 'grant_types')){
        dataPayload.client_name = get(decodedSoftwareStatement, 'grant_types');
      }
      if(get(decodedSoftwareStatement, 'response_types')){
        dataPayload.client_name = get(decodedSoftwareStatement, 'response_types');
      }
      if(get(decodedSoftwareStatement, 'token_endpoint_auth_method')){
        dataPayload.client_name = get(decodedSoftwareStatement, 'token_endpoint_auth_method');
      }

      if(get(decodedSoftwareStatement, 'contacts')){
        dataPayload.client_name = get(decodedSoftwareStatement, 'contacts');
      }
      if(get(decodedSoftwareStatement, 'tos_uri')){
        dataPayload.client_name = get(decodedSoftwareStatement, 'tos_uri');
      }
      if(get(decodedSoftwareStatement, 'policy_uri')){
        dataPayload.client_name = get(decodedSoftwareStatement, 'policy_uri');
      }
      if(get(decodedSoftwareStatement, 'logo_uri')){
        dataPayload.client_name = get(decodedSoftwareStatement, 'logo_uri');
      }

      let returnPayload = {
        code: 201,
        data: dataPayload
      }


      if(process.env.TRACE){
        console.log('return payload', returnPayload);
      }
     
      JsonRoutes.sendResult(res, returnPayload);  
    } else {
      // oops, already found the registration
      JsonRoutes.sendResult(res, {
        code: 400,
        data: {
          "error": "unapproved_software_statement"
       }
      });  
    }
  });
  JsonRoutes.add("get", "/oauth/token", function (req, res, next) {
    console.log('========================================================================');
    console.log('GET ' + '/oauth/token');

    res.setHeader('Content-type', 'application/json');
    res.setHeader("Access-Control-Allow-Origin", "*");

    let returnPayload = {
      code: 200,
      data: {
        "message": 'token'
      }
    }
    if(process.env.TRACE){
      console.log('return payload', returnPayload);
    }
   
    JsonRoutes.sendResult(res, returnPayload);
  });
  JsonRoutes.add("get", "/oauth/authorize", function (req, res, next) {
    console.log('========================================================================');
    console.log('GET ' + '/oauth/authorize');

    res.setHeader('Content-type', 'application/json');
    res.setHeader("Access-Control-Allow-Origin", "*");

    console.log("")
    console.log(req.query)
    console.log('Redirect: ' + get(req, 'query.redirect_uri'))
    console.log("")

    if(get(req, 'query.client_id')){
      let client = OAuthClients.findOne({_id: get(req, 'query.client_id')});
      if(client){
        console.log('client', client)
      } else {
        console.log('No client found matching that client_id');
      }
    }

    let returnPayload = {
      code: 200,
      data: {
        "message": 'authenticate'
      }
    }

    if(get(req, 'query.redirect_uri')){
      returnPayload.code = 301;
      res.setHeader("Location", get(req, 'query.redirect_uri'));

      console.log('returnPayload', returnPayload)
      JsonRoutes.sendResult(res, returnPayload);
    } else {
      console.log('returnPayload', returnPayload)
      JsonRoutes.sendResult(res, returnPayload);
    }   
  });

  JsonRoutes.add("get", "/authorizations/manage", function (req, res, next) {
    console.log('========================================================================');
    console.log('GET ' + '/authorizations/manage');

    res.setHeader('Content-type', 'application/json');
    res.setHeader("Access-Control-Allow-Origin", "*");

    let returnPayload = {
      code: 200,
      data: {
        "message": 'authenticate'
      }
    }
    if(process.env.TRACE){
      console.log('return payload', returnPayload);
    }
   
    JsonRoutes.sendResult(res, returnPayload);
  });

  JsonRoutes.add("get", "/authorizations/introspect", function (req, res, next) {
    console.log('========================================================================');
    console.log('GET ' + '/authorizations/introspect');

    res.setHeader('Content-type', 'application/json');
    res.setHeader("Access-Control-Allow-Origin", "*");

    let returnPayload = {
      code: 200,
      data: {
        "message": 'authenticate'
      }
    }
    if(process.env.TRACE){
      console.log('return payload', returnPayload);
    }
   
    JsonRoutes.sendResult(res, returnPayload);
  });

  JsonRoutes.add("post", "/authorizations/revoke", function (req, res, next) {
    console.log('========================================================================');
    console.log('POST ' + '/authorizations/revoke');

    res.setHeader('Content-type', 'application/json');
    res.setHeader("Access-Control-Allow-Origin", "*");

    let searchQuery = {};
    if (get(req, 'query.client_name')) {
      console.log('query', get(req, 'query.client_name'))
      searchQuery.client_name = get(req, 'query.client_name');
    }

    if(get(req, 'query.client_id')){
      console.log('query', get(req, 'query.client_id'))
      searchQuery.client_id = get(req, 'query.client_id');
    }

    let removeSuccess = OAuthClients.remove(searchQuery);
    console.log('removeSuccess', removeSuccess);

    let returnPayload = {}

    if(removeSuccess){
      returnPayload.code = 200; 
    } else {
      returnPayload.code = 410;
    }
  
    if(process.env.TRACE){
      console.log('return payload', returnPayload);
    }
   
    JsonRoutes.sendResult(res, returnPayload);
  });
});




// Meteor.methods({
//   getMetadata(){
//     return Server.getCapabilityStatement();
//   }
// });
