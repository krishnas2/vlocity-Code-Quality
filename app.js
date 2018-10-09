// app.js
var express = require('express'),
app = express(),  
server = require('http').createServer(app),  
io = require('socket.io')(server),
bodyParser = require('body-parser'),
querystring=require('querystring'),
https=require('https'),
request = require('request'),
username='',
access_token='',
access_token='',
instance_url='',
squery='/services/data/v41.0/query/?q=';

app.use(express.static(__dirname + '/node_modules'));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded());

// parse application/json
app.use(bodyParser.json());

app.get('/', (req, res,next) => {  
    res.sendFile(__dirname + '/login.html');
});
app.get('/index', (req, res,next) =>{  
    res.sendFile(__dirname + '/index.html');
});
app.post('/', (req, res,next) =>{  
//username=req.body.username;
for (i in req.body){
		i=JSON.parse(i);
		username=i.username,
		console.log(i.username);
	}
    res.send('/index');
	res.end();
});
var namingconventioncheck=(name,client)=>{
	client.emit('objjobs',"Checking Naming Convention");
	if(name.match("^([A-Z]+[a-z_0-9]*)+$")){
		client.emit('objjobs',"Naming Convention is Followed");
	}
	else{
		client.emit('objjobs',"<b>Warning: Naming Convention is Not Followed</b>");
		
		client.emit('objjobswar',"Naming Should follow pattern ^([A-Z]+[a-z_0-9]*)+$");
	}
}
var isEmpty = (obj)=> {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}
var objectexists=(bundle,name,client)=>{
	que="select+Id+from+vlocity_cmt__"+bundle+"__c+where+Name=+'"+name.replace(/\s/g,'+')+"'";
	client.emit('objjobs','<h4><u>Level 1: Object Existence and Active Version</u></h4>');
	client.emit('objjobs','Checking Whether '+bundle+' Object with name '+name+' exists');
	RestCallMapper(que,'genericexists',name,client);
	var temp='';
	if (bundle === "VlocityAction"){
		que2="select+Id+from+vlocity_cmt__"+bundle+"__c+where+Name=+'"+name.replace(/\s/g,'+')+"'+and+vlocity_cmt__IsActive__c=true";
		temp='action';
	}
	else{
	
	switch(bundle){
		case "VlocityUITemplate":
		temp='t';break;
		case "VlocityCard":
		temp='c';break;
		case "VlocityUILayout":
		temp='l';break;
	}
	que2="select+Id+from+vlocity_cmt__"+bundle+"__c+where+Name=+'"+name.replace(/\s/g,'+')+"'+and+vlocity_cmt__Active__c=true";
						
	}
	RestCallMapper(que2,'genericactive'+temp,name,client);
}
var actionsvals=(rec,name,client)=>{
	try{
	for (i in rec){
		if(rec.hasOwnProperty(i)){
			client.emit('objjobs','Checking '+i);
			if(rec[i]!==null && rec[i]!='')
				client.emit('objjobs',i+' is fine ');
			else{
				client.emit('objjobs','<b>Error: '+i+' is null</b>');
				client.emit('objjobserr',i+' of the Object '+name+' is NULL');
			}
		}
	}
	}
	catch(e){
		client.emit('objjobserr','Error in Object '+name);
		client.emit('objjobserr','Error in Object '+name+' is '+e);
	}
	finally{
	client.emit('objjobs','Checking of Object '+name+' is Done');
	}
}
var actionperform=(name,client)=>{
	try{
	que3="select+vlocity_cmt__OpenURLMode__c,vlocity_cmt__LinkType__c,vlocity_cmt__URL__c,vlocity_cmt__UrlParameters__c,vlocity_cmt__DisplayOn__c+from+vlocity_cmt__"+"VlocityAction"+"__c+where+Name=+'"+name.replace(/\s/g,'+')+"'and+vlocity_cmt__IsActive__c=true";
	client.emit('objjobs','<h4><u>Level 3: Getting Required Values</u></h4>');
	RestCallMapper(que3,'actionsvals',name,client);}
	catch(e){
		client.emit('objjobs','There is some issue with while performing opration');
		client.emit('objjobserr','The issue for '+name+' is '+e);
		client.emit('objjobs','Checking of Object '+name+' is Done');
	}
}
var genericperform=(msg,name,client)=>{
	client.emit('objjobs','<h4><u>Level 3: Checking Naming Convention and Getting Required Values</u></h4>');
	namingconventioncheck(name,client);
	switch(msg){
		case 'genericactivet':que3="select+vlocity_cmt__HTML__c,vlocity_cmt__CustomJavascript__c,vlocity_cmt__Sass__c,vlocity_cmt__CSS__c+from+vlocity_cmt__VlocityUITemplate__c+where+name+='"+name.replace(/\s/g,'+')+"'";
		RestCallMapper(que3,'templatevals',name,client);
			break;
		default: client.emit('objjobs','Checking of the Object is Done');
		
	}
}

var RestCallMapper=(query,msg,opt,client)=>{
	var headers={
		'Content-Type':'application/json',
		'Authorization':access_token
	};
	var newOptions={
		host:instance_url,
		port:null,
		path:squery+query,
		method:'GET',
		headers:headers
	};
	//console.log('query',instance_url,newOptions.path);
	var qryObj=https.request(newOptions,function(result){
		result.setEncoding('utf-8');
		var responseString1='';
		result.on('data',function(respObj){
			responseString1+=respObj;
		});
		result.on('end',function(){
			var resp=JSON.parse(responseString1);
			console.log('respo',resp.done,resp.totalSize,resp);
			
			
			 if(resp.done && resp.totalSize>0){
				 switch(msg){
					 case "actionsvals":client.emit('objjobs','Starting operations for Vlocity Action Object');actionsvals(resp.records[0],opt,client);break;
					 case "LoadDRperformop":client.emit('objjobs','Starting operations for Load DR');LoadDRperformop(resp.records,client);break;
					 case "genericactivet":
					 case "genericactivec":
					 case "genericactivel":
					 client.emit('objjobs','<h4><u>Level 2: Execution Status</u></h4>');client.emit('objjobs','Active version Exists');genericperform(msg,opt,client);break;
					  case "genericactiveaction":client.emit('objjobs','<h4><u>Level 2: Execution Status</u></h4>');client.emit('objjobs','Active version Exists');actionperform(opt,client);	break;
					 case "genericexists":client.emit('objjobs','Object Exists');break;
             case "CheckOmniScriptExists":client.emit('objjobs',"Omniscript Exists");OmniScriptcheckactiveversion(opt,client);break;
				case "DR Exists": client.emit('objjobs','Data Raptor Exists');drtype(resp.records,opt,client);break;
				case "ExtractDRperformop":client.emit('objjobs','Starting operations for Extract DR');ExtractDRperformop(resp.records,client);break;
				case "DRqueries":client.emit('objjobs','DR query is success');break;
				case "OmniscriptsExists":client.emit('objjobs','Omniscript Exists');getOmniScriptDetails(resp,client);break;
				case "OmniScriptperformop":client.emit('objjobs','Starting operations for Omniscript');OmniScriptperformop(resp,client);break;
			}
			 }
			 else if (resp.done && resp.totalSize==0){
				 switch(msg){
					 case "actionsvals":client.emit('objjobs','There is an issue with Vlocity Action ');client.emit('objjobserr','There is an issue with Vlocity Action '+opt);client.emit('objjobs','Checking of Object '+name+' is Done');break;
					 case "LoadDRperformop":
					 case "ExtractDRperformop":
					 client.emit('objjobs','DR query may be correct but to perform any operation no records returned for the query');client.emit('objjobserr','DR query may be correct but to perform any operation no records returned . Please Fill some fields and excute the task again');client.emit('objjobs','Checking DR is Done');break;
					 case "genericactivet":
					 case "genericactivec":
					 case "genericactivel":
					 case "genericactiveaction":
					 client.emit('objjobserr','Active version Doesnt Exists');client.emit('objjobs','<b>Error: Active version Doesnt Exists</b>');client.emit('objjobs','Checking Object is Done');break;
					 case "genericexists":client.emit('objjobserr',"Object Doesn't Exists,Give Correct Name and try again");client.emit('objjobs',"Object Doesn't Exists,Give Correct Name and try again");client.emit('objjobserr',"Checkign of Object is Done");break;
           case "CheckOmniScriptExists":client.emit('objjobserr',"Omniscript "+opt+" Doesn't Exists, Give correct name");client.emit('objjobs',"There is no active version of this omniscript");client.emit('objjobs','Checking Omniscript is Done');break;
				case "DR Exists": client.emit('objjobs',"DR query may be correct but there were no records for the query");client.emit('objjobserr',"DR query may be correct but there were no records for the query");client.emit('objjobs','Checking DR is Done');break;
				
				case "OmniscriptsExists":client.emit('objjobs',"Omniscript query may be correct but there were no records for the query"+JSON.stringify(resp,null,2));client.emit('objjobserr',"Omniscript query may be correct but there were no records for the query,kindly activate the Omniscript and try again"+JSON.stringify(resp,null,2));client.emit('objjobs','Checking Omniscript is Done');break;
				case "DRqueries":client.emit('objjobs','DR query may be correct but there were no records for the query,this could be due to field level security as well'+JSON.stringify(resp,null,2));break;
				case "OmniScriptperformop":client.emit('objjobs','Omniscript query may be correct but there were no records for the query to perform any opration');break;
			}
			 }
			 else{
				 switch(msg){
				case "DR Exists": client.emit('objjobs',"Data Raptor Doesn't Exist");client.emit('objjobserr',"Data Raptor Doesn't Exist");client.emit('objjobs','Checking DR is Done');break;
				case "ExtractDRperformop":client.emit('objjobs','Starting operations for Extract DR');client.emit('objjobserr','Starting operations for Extract DR');break;
				case "OmniscriptsExists":client.emit('objjobs',"Omniscript Doesn't Exists"+JSON.stringify(resp,null,2));client.emit('objjobserr',"Omniscript Doesn't Exists");client.emit('objjobs','Checking Omniscript is Done');break;
				case "DRqueries":client.emit('objjobs','DR query failed'+JSON.stringify(resp,null,2)+',this could be due to field level security as wel');client.emit('objjobs','DR query is failed');break;
				case "OmniScriptperformop":client.emit('objjobs','Starting operations for Omniscript');client.emit('objjobserr','Starting operations for Omniscript');break;
			}
			 }
				console.log(msg);
		});
	});
	qryObj.on('error',(e)=>{
		console.log('problemquery',e);
		client.emit('objjobs','There is a problem with request');
		client.emit('objjobserr','There is a problem with request');
	});
	qryObj.end();
};

function typesubtypequery  (name) {
	var temp=name.lastIndexOf('_');
	console.log(name.substring(0,temp),name.substring(temp+1,));
	return "select+Id,vlocity_cmt__PropertySet__c+from+vlocity_cmt__OmniScript__c+where+vlocity_cmt__Type__c='"+name.substring(0,temp)+"'+and+vlocity_cmt__SubType__c='"+name.substring(temp+1,)+"'";
}
var OmniScriptperformop=(resp,client)=>{
	var sample={};
	var i1=0,i2=0;
	client.emit('objjobs',"<h4><u>Level 4 : OmniScript Code Quality Operations </u></h4> ");
	for (var i=0;i<resp.records.length;i++){
		//console.log(resp.records[i].Name,true);
		if(resp.records[i]["vlocity_cmt__Active__c"]){
		sample[resp.records[i].Name]=true;
		propset=JSON.parse(resp.records[i]["vlocity_cmt__PropertySet__c"]);
		//client.emit('objjobs','Checking Node '+resp.records[i].Name);
		//client.emit('objjobs','Type '+resp.records[i]["vlocity_cmt__Type__c"]);
		switch(resp.records[i]["vlocity_cmt__Type__c"]){
			case "Response Action":i1+=1;break;
			case "Step":i2+=1;break;
			case "OmniScript": client.emit('objjobs','Starting a new Thread for Re-Usable Omniscript '+resp.records[i].Name);
							getObjectDetails('OmniScript',resp.records[i].Name,client);break;
			case "Integration Procedure Action":
							client.emit('objjobs','Starting a new Thread for IP '+propset.integrationProcedureKey+' referred at JSON Node '+resp.records[i].Name);
							//console.log(resp.records[i],'check',propset);
							getObjectDetails('IntegrationProcedure',propset.integrationProcedureKey,client);
						break;
			case "Remote Action":
								
								if(propset.responseJSONNode && sample[propset.responseJSONNode]===undefined && propset.responseJSONNode!="vlcCart"){//Check for persistent component should be made dynamic
									//console.log(sample,sample[propset.responseJSONNode],resp.records[i].Name,propset.responseJSONNode,'sample');
									client.emit('objjobs','Saving response JSON Node Name for Refrencing in Selectable Items');
									sample[propset.responseJSONNode]=false;
								}
								if(propset.preTransformBundle|| propset.postTransformBundle){
									client.emit('objjobs','Starting a New Thread for the DataRaptor '+propset.preTransformBundle!==""?propset.preTransformBundle:propset.postTransformBundle+' at JSON NOde '+resp.records[i].Name);
									getObjectDetails("DataRaptor",propset.preTransformBundle!==""?propset.preTransformBundle:propset.postTransformBundle,client);
								}
								break;
			case "DataRaptor Extract Action":
			case "DataRaptor Post Action":
			case "DataRaptor Transform Action":
										if(propset.bundle){
											client.emit('objjobs','Starting a New Thread for the DataRaptor');
											getObjectDetails("DataRaptor",propset.bundle,client);
										}
										break;
		}
	}
	}
	client.emit('objjobs',"<h4><u>Level 5 : Execution Status </u></h4> ");
	if (i2===0){
		client.emit('objjobs','Chekcing for Response Action');
		if(i1===0){
			client.emit('objjobserr','There is no Response Action Present');
			client.emit('objjobs','<b>Error: There is no Response Action Present</b>');
		}
		else{
			client.emit('objjobserr','Response Action Exists ');
		}
	}
	for (i in sample){
		//console.log(sample[i],i);
		if (sample.hasOwnProperty(i) && sample[i]===false){
			client.emit('objjobs',i+' is not existing but used');
		client.emit('objjobserr',i+' is not existing but used');
			console.log(i,' is not existing but used');
		}
		/* else{
			client.emit('objjobs','Checked Node'+i);
		} */
	}
	client.emit('objjobs','Checking Omniscript is Done');
}
var OmniScriptcheckactiveversion=(name,client)=>{
  q1="select+Id,vlocity_cmt__PropertySet__c+from+vlocity_cmt__OmniScript__c+Where+Name='"+name.replace(/\s/g,'+')+"'+and+vlocity_cmt__IsActive__c=true";
  client.emit('objjobs',"<h4><u>Level 2 : Check For Naming Convention and Active Version </u></h4> ");
  namingconventioncheck(name,client);
	client.emit('objjobs','Checking for active version of the object');
	RestCallMapper(q1,'OmniscriptsExists',name,client);
}
var OmniscriptsExists=(name,bundle,client)=>{
	client.emit('objjobs',"<h4><u>Level 1 : Object Existence </u></h4> ");
	console.log(name);
  tq=bundle=='IntegrationProcedure'?typesubtypequery(name):"select+Id,vlocity_cmt__PropertySet__c+from+vlocity_cmt__OmniScript__c+Where+Name='"+name.replace(/\s/g,'+')+"'";
  client.emit('objjobs','Checking if '+bundle+'is present');
  RestCallMapper(tq,'Check'+'OmniScript'+'Exists',name,client);
	
}
var getOmniScriptDetails=(resp,client)=>{
	try{
	client.emit('objjobs',"<h4><u>Level 3 : Extracting Required Details </u></h4> ");	
	if(resp.totalSize>0){
		q2="select+Name,vlocity_cmt__Type__c,vlocity_cmt__PropertySet__c,vlocity_cmt__Level__c,vlocity_cmt__Active__c,Id+from+vlocity_cmt__Element__c+where+vlocity_cmt__OmniScriptId__c='"+resp.records[0].Id+"'+ORDER+BY+vlocity_cmt__Level__c,vlocity_cmt__Order__c";
		client.emit('objjobs',"Starting to  perform operations on Omniscript Id "+resp.records[0].Id);
		RestCallMapper(q2,'OmniScriptperformop',null,client);
	}
	else{// NO RECORDS
	client.emit('objjobs',"Omniscript is either not active or doesn't exist");
		client.emit('objjobserr',"Omniscript is either not active or doesn't exist");
		console.log("Omniscript is either not active or doesn't exist");
	}
	}
	catch(e){
		client.emit('objjobs',"Error Occured"+e);
		client.emit('objjobserr',"Error Occured"+e);
	}
}

var drtype=(lis,name,client)=>{
	try{
	client.emit('objjobs',"<h4><u>Level 2 : Getting Object Details</u></h4> ");
	client.emit('objjobs',"Type of DR is"+lis[0]['vlocity_cmt__Type__c'] );
	client.emit('objjobs',"<h4><u>Level 3 : Basic Checks</u></h4> ");
	namingconventioncheck(name,client);
	var val=false;
	switch(lis[0]['vlocity_cmt__Type__c']){
		case "Extract":
		case "Extract (JSON)":
		//client.emit('objjobs',"Type of DR is Extract");	
		client.emit('objjobs',"Checking Sample Input JSON");
		if(isEmpty(JSON.parse(lis[0]['vlocity_cmt__SampleInputJSON__c']))){
			client.emit('objjobs',"<h5><b>Error: Sample Input JSON is NULL</b> </h5>");
			client.emit('objjobserr',"Execute DR preview for a valid value");
			val=true;
		}
		else{
			client.emit('objjobs'," Sample Input JSON is not NULL");
		}
		client.emit('objjobs',"Checking Field Level Security");
		if(lis[0]["vlocity_cmt__CheckFieldLevelSecurity__c"]===true){
			client.emit('objjobs',"Checkbox is Checked");
			q2="select+vlocity_cmt__FilterOperator__c,vlocity_cmt__FilterValue__c,vlocity_cmt__FilterGroup__c,vlocity_cmt__InterfaceFieldAPIName__c,vlocity_cmt__InterfaceObjectName__c,vlocity_cmt__DomainObjectFieldAPIName__c+from+vlocity_cmt__DRMapItem__c+where+Name=+'"+name.replace(/\s/g,'+')+"'";//get required values
			
			client.emit('objjobs',"Getting Required DR values by "+q2);
		RestCallMapper(q2,'ExtractDRperformop',null,client);}
		else{
			client.emit('objjobs',"<b>Error:Field Level security is not checked</b> ");
			client.emit('objjobserr',"Check the Field Level Security Checkbox");
			val=true;
		}
		break;
	case "Load":
	if(lis[0]["vlocity_cmt__OutputType__c"]==="SObject"){
		client.emit('objjobs',"Checking Assignement Rules");
		if(lis[0]["vlocity_cmt__UseAssignmentRules__c"]===true ){
			client.emit('objjobs',"Assignment Rules is checked");
		}
		else{
			client.emit('objjobs',"<b>Warning: Assignment Rules is not checked</b>");
			client.emit('objjobswar',"Assignment Rules Checkbox is not checked");
		}
	}
	client.emit('objjobs',"Checking Upsert key");
	q2="select+vlocity_cmt__DomainObjectFieldAPIName__c,vlocity_cmt__DomainObjectAPIName__c,vlocity_cmt__UpsertKey__c+from+vlocity_cmt__DRMapItem__c+where+Name=+'"+name.replace(/\s/g,'+')+"'";
	//,vlocity_cmt__FilterOperator__c,vlocity_cmt__FilterValue__c,vlocity_cmt__FilterGroup__c,vlocity_cmt__InterfaceFieldAPIName__c,vlocity_cmt__InterfaceObjectName__c,vlocity_cmt__DomainObjectCreationOrder__c,vlocity_cmt__DomainObjectFieldType__c,
	client.emit('objjobs','Getting required Values for execution'+q2);
	RestCallMapper(q2,'LoadDRperformop',null,client);	
				break;
    default:
      
      client.emit('objjobs',"Checking of DR is Done");
			
	}
	if(val==true){
		client.emit('objjobs',"Checking of DR is Done");
	}
	}
	catch(e){
		client.emit('objjobs',"Error Occured "+e);
		client.emit('objjobserr',"Error Occured "+e);
	}
}
var LoadDRperformop=(lis,client)=>{
	client.emit('objjobs',"<h4><u>Level 4 : Executing Code Quality Check</u></h4> ");
	client.emit('objjobs',"Checking Upsert is Checked ");
	var samples={},
	temp='',
	upsert=false;
	for (var i=0;i<lis.length;i++){
		temp='';
		if(lis[i]["vlocity_cmt__UpsertKey__c"]===true){upsert=true;}
		//client.emit('objjobs',samples.hasOwnProperty(lis[i]["vlocity_cmt__DomainObjectAPIName__c"])+lis[i]["vlocity_cmt__DomainObjectAPIName__c"]+JSON.stringify(samples,null,2));
		if(samples.hasOwnProperty(lis[i]["vlocity_cmt__DomainObjectAPIName__c"])){temp=samples[lis[i]["vlocity_cmt__DomainObjectAPIName__c"]]+',';}
		samples[lis[i]["vlocity_cmt__DomainObjectAPIName__c"]]=temp+lis[i]["vlocity_cmt__DomainObjectFieldAPIName__c"];
	}
	if(upsert===true){
		client.emit('objjobs',"Upsert is Checked ");
	}
	else{
		client.emit('objjobs',"<b>Warning: Upsert is not Checked </b>");
		client.emit('objjobswar',"Upsert is not Checked ");
	}
	console.log(samples);
	 for (i in samples){
		if(samples[i] && i){
		var tempquery='select+'+samples[i]+'+from+'+i+'+LIMIT+1';
		console.log('tempquery',tempquery);
		client.emit('objjobs',"Checking whether Fields "+samples[i]+" are present in "+i);
		RestCallMapper(tempquery,'DRqueries',null,client);
		}
	 }
	client.emit('objjobs','Checking DR is Done');	
}
var ExtractDRperformop=(lis,client)=>{
	try{
	var sample={},
	holder={},
	temp=[],
	a='',b='';
	client.emit('objjobs',"<h4><u>Level 4 : Executing Code Quality Check</u></h4> ");
	for (var i=0;i<lis.length;i++){
				if(lis[i]['vlocity_cmt__FilterOperator__c'] !=null){
					a=lis[i]["vlocity_cmt__InterfaceObjectName__c"];
					b=lis[i]["vlocity_cmt__InterfaceFieldAPIName__c"];
					holder[lis[i]["vlocity_cmt__DomainObjectFieldAPIName__c"]]=a;
				}
				if(b && !b.match(/\[/i)){
				if(sample.hasOwnProperty(a)){
						if(!sample[a].match(b)){
						sample[a]+=','+b;}
					}
					else{
						sample[a]=b;
					}
				}
			}
	for (var i=0;i<lis.length;i++){
				if(lis[i]['vlocity_cmt__FilterOperator__c'] ===null && lis[i]['vlocity_cmt__DomainObjectFieldAPIName__c']!=="Formula"){
					//console.log(lis[i]["vlocity_cmt__InterfaceFieldAPIName__c"],lis[i]);
					try{
					console.log(lis[i]["vlocity_cmt__InterfaceFieldAPIName__c"],lis[i]);
					var temp=lis[i]["vlocity_cmt__InterfaceFieldAPIName__c"].lastIndexOf(":");
					if (temp!==-1){
					a=holder[lis[i]["vlocity_cmt__InterfaceFieldAPIName__c"].substring(0,temp)];
					b=lis[i]["vlocity_cmt__InterfaceFieldAPIName__c"].substring(temp+1,);}
					}
					catch(e){
						client.emit('objjobser',"Issue with current JSON Node ");
						client.emit('objjobs',"Issue with current JSON Node  "+JSON.stringify(lis[i],null,2));
						
					}
					
				}
				if(b && !b.match(/\[/i)){
				if(sample.hasOwnProperty(a)){
						if(!sample[a].match(b)){
						sample[a]+=','+b;}
					}
					else{
						sample[a]=b;
					}
				}
			}
	console.log(sample,holder);
	 for (i in sample){
		//console.log('fdf',i);
		if(sample[i] && i){
		var tempquery='select+'+sample[i]+'+from+'+i+'+LIMIT+1';
		console.log('tempquery',tempquery);
		client.emit('objjobs',"Checking whether Fields "+sample[i]+" are present in "+i);
		RestCallMapper(tempquery,'DRqueries',null,client);
		}
	}
client.emit('objjobs','Checking DR is Done');	
	}
	catch(e){
		client.emit('objjobs',"Error Occured "+e);
		client.emit('objjobserr',"Error Occured "+e);
	}
}
var DRExists=(name,client)=>{
	q1="select+Id,vlocity_cmt__Type__c,vlocity_cmt__OutputType__c,vlocity_cmt__UseAssignmentRules__c,vlocity_cmt__CheckFieldLevelSecurity__c,vlocity_cmt__SampleInputJSON__c+from+vlocity_cmt__DRBundle__c+where+Name+=+'"+name.replace(/\s/g,'+')+"'";//Check DR is created
	client.emit('objjobs'," <h4><u>Level 1 : Object Existence</u></h4> ");
	client.emit('objjobs',"Checking DR Exists ");
	RestCallMapper(q1,'DR Exists',name,client);
}

var getObjectDetails=(bundle,name,client)=>{//Gettign Object Details
	//console.log(bundle,name);
	client.emit('objjobs',"Starting a new Operation ");
	client.emit('objjobs',"Type of Object is "+bundle);
	client.emit('objjobs',"Object's Name is "+name);
	switch (bundle){
	case "DataRaptor":DRExists(name,client);break;
	case "OmniScript":
	case "Integration_Prodecure":
	case "IntegrationProcedure":
	OmniscriptsExists(name,bundle,client);break;
	default:objectexists(bundle,name,client);
	}
}
io.on('connection', (client)=> {  
    console.log('Client connected...');
	client.emit('username', username);
    client.on('join', (data)=> {
        console.log(data);
		client.emit('broad', data);
    });
f='d';
    client.on('joined', (data)=> {
           client.emit('broad', Number(data)+10);
           //client.broadcast.emit('broad',data);
    });
	client.on('sfdcdetails', (data)=> {
		try{
           console.log('sfdc',data);
		   console.log('came here1');
		   client.emit('sfdccoms', 20);
		   client.emit('sfdccomslog', 'Execution Started');
		   access_token=data.token_type+' '+data["Handshake#access_token"];
		   instance_url=data.instance_url.split('/')[2];
		   client.emit('sfdccoms', 100);
		   if(access_token){
				console.log('connection'+'established');
				client.emit('sfdccomslog', '<h4><u>4.Connection Status</u></h4>');
			client.emit('sfdccomslog', 'Connection Established');
			//getObjectDetails(v3,v4);
			}
	/*var headers={
		'Content-Type':'application/json'
	},
	data={
		'grant_type':'password',
		'client_id':data.clientid,
		'client_secret':data.clientsecret,
		'username':data.username,
		'password':data.password
	};
	client.emit('sfdccoms', 30);
	//client.emit('sfdccomslog', '<h4><u>1.Capturing Details</u></h4>');
	//client.emit('sfdccomslog', 'Reading of Details is Done');
	var host=data.env=="Production"?'login.salesforce.com':'test.salesforce.com',
	endpoint = '/services/oauth2/token?'+querystring.stringify(data);
	console.log(data['client_id'],data['username'],data['password']);
	var options={
		host:host,
		port:null,
		path:endpoint,
		method:'POST',
		headers:headers
	};
	console.log('came hhh');
	//client.emit('sfdccomslog', '<h4><u>2.Forming Options for REST Call</u></h4>');
	//client.emit('sfdccomslog', 'endpoint url is formed');
	//client.emit('sfdccoms', 40);
	var req=https.request(options,function(res){
		res.setEncoding('utf-8');
		var responseString='';
		//client.emit('sfdccoms', 50);
		res.on('data',function(respObj){
			responseString+=respObj;
		});
		//client.emit('sfdccoms', 70);
		res.on('end',function(){
			
				//client.emit('sfdccomslog', '<h4><u>3.REST Call Result</u></h4>');
			console.log('rstring',responseString);
			var responseObject=JSON.parse(responseString);
			//console.log(responseObject);
			//client.emit('sfdccomslog', ' response object is '+JSON.stringify(responseObject,null,2));
			access_token=responseObject.token_type+' '+responseObject.access_token;
			instance_url=responseObject.instance_url.split('/')[2];
			client.emit('sfdccoms', 100);
			if(access_token){
				console.log('connection'+'established');
				client.emit('sfdccomslog', '<h4><u>4.Connection Status</u></h4>');
			client.emit('sfdccomslog', 'Connection Established');}
			//getObjectDetails(v3,v4);
			}*/
	}
			catch(e){
				
				client.emit('sfdccomslog', '<h4><u>Error in Request</u></h4>');
				console.log('error',e);
				client.emit('sfdccomslog','There is an Error'+e);
			}
		});
		
	});
	req.on('error',(e)=>{
		client.emit('sfdccomslog','Problem with Request'+e);
		console.log('problem'+e);
	});
	req.end();
    });
	
	client.on('sfdcobjdetails', (data)=> {
        console.log(data);
		getObjectDetails(data.selectedName,data.objname,client);
    });
	
	client.on('jiracheckupdation', (data)=> {
        console.log(data);
		var url = data.url ;
		//"https://kkjtest2.atlassian.net/rest/api/2/issue/TES-1/transitions"
		var message = {
			"update": {
				"comment": [{"add": {"body": "Test commenting."}}]
			},
			"transition": {"id": data.id}
		},
		options={
			url: url,
			method: "POST",
			json: true,
			body: message,
			auth: {user: data.jirausname, pass: data.jirapsswrd}
		};
		console.log(options);
		request(options, function (error, response, body) {
			if (!error && response.statusCode === 204) {
				console.log("OK");
				client.emit('jirasuccess', '');
			} else if (error) {
				console.log(error);
				client.emit('jiraserr', 'Due to Error'+error);
			} else {
				console.log(response.statusCode);
				client.emit('jiraserr', 'With a Status Code'+response.statusCode);
			}
		});
    });
});

server.listen(process.env.PORT || 4200); 
