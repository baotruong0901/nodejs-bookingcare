// import { promiseImpl } from 'ejs'
import db from "../models/index"
import bcrypt from 'bcryptjs'
require('dotenv').config()
import _ from "lodash"
const MAX_NUMBER_SCHEDULE=process.env.MAX_NUMBER_SCHEDULE
let getTopDoctorHomeService=(limit)=>{
    return new Promise(async(resolve,reject)=>{
        try{
            let users=await db.User.findAll({
                limit:limit,
                where:{roleId:'R2'},
                order: [
                    ["createdAt","DESC"]
                ],
                attributes:{
                    exclude:['password']
                },
                include:[
                    {model:db.Allcode, as:'positionData', attributes:['valueEn', 'valueVi']},
                    {model:db.Allcode, as:'genderData', attributes:['valueEn', 'valueVi']},
                ], 
                raw:true,
                nest:true
                
            })
            resolve({
                errCode:0,
                data:users
            })
        }catch(err){
            reject(err)
        }
    })
}

let getAllDoctor=()=>{
    return new Promise(async(resolve, reject)=>{
        try{
            let allDoctor=await db.User.findAll({
                where:{roleId:'R2'},
                attributes:{
                    exclude:['password','image']
                },
            })
            resolve({
                errCode:0,
                data:allDoctor,
            })
        }catch(err){
            reject(err)
        }
    })
}


let saveInfoDoctor=(data)=>{
    return new Promise(async(resolve,reject)=>{
        try{
            if(!data.doctorId||!data.contentHTML||!data.contentMarkdown||!data.action){
                resolve({
                    errCode:1,
                    message:'Missing parameter!'
                })
            }else{
                if(data.action === 'CREATE'){
                    await db.Markdown.create({
                    contentHTML:data.contentHTML,
                    contentMarkdown:data.contentMarkdown,
                    description:data.description,
                    doctorId:data.doctorId
                    })
                }else if(data.action === 'UPDATE'){
                    let doctor= await db.Markdown.findOne({
                        where:{doctorId:data.doctorId},
                        raw:false,
                    })
                    if(doctor){
                        doctor.contentHTML=data.contentHTML
                        doctor.contentMarkdown=data.contentMarkdown
                        doctor.description=data.description
                        await doctor.save()
                    }
                    
                }
                
                resolve({
                    errCode:0,
                    message:'Save info doctor succeed!'
                })
            }
        }catch(err){
            reject(err)
        }
    })
}

let getInfoDoctorById = (id)=>{
    return new Promise(async(resolve, reject)=>{
        try{
            if(!id){
                resolve({
                    errCode:1,
                    message:'Missing required parameter!'
                })
            }else{
                let data=await db.User.findOne({
                    where:{id:id},
                    attributes:({
                        exclude:['password']
                    }),
                    include:[
                        {model:db.Markdown, attributes:['description', 'contentHTML','contentMarkdown']},
                        {model:db.Allcode, as:'genderData', attributes:['valueEn', 'valueVi']},
                        {model:db.Allcode, as:'positionData', attributes:['valueEn', 'valueVi']},
                    ],
                    raw:false,
                    nest:true
                })

                if(data && data.image){
                    data.image=new Buffer(data.image,'base64').toString('binary')
                }
                if(!data){
                    data={};
                }
                resolve({
                    errCode:0,
                    data:data
                })
            }
            
        }catch(err){
            reject(err)
        }
    })
}

let bulkCreateSchdule = (data)=>{
    return new Promise(async(resolve, reject)=>{
        try{
            if(!data.arrSchedule||!data.doctorId||!data.formatedDate){
                resolve({
                    errCode:1,
                    message:'Missing required parameter!'
                })
            }else{
                let schedule= data.arrSchedule
                if(schedule && schedule.length>0){
                    schedule=schedule.map(item=>{
                        item.maxNumber=MAX_NUMBER_SCHEDULE
                        return item
                    })
                }
                console.log('>>>', data.doctorId, data.formatedDate);
                let existing= await db.Schedule.findAll({
                    where:{doctorId:data.doctorId, date:data.formatedDate},
                    attributes:['timeType','date','doctorId','maxNumber'],
                    raw:true
                })
                console.log("existing",existing);
                console.log("schedule",schedule);

                // if(existing && existing.length>0){
                //     existing=existing.map(item=>{
                //         item.date=new Date(item.date).getTime()
                //         return item
                //     })
                // }
                let toCreate=_.differenceWith(schedule,existing,(schedule,existing)=>{
                    return schedule.timeType === existing.timeType && +schedule.date === +existing.date
                })

                if(toCreate && toCreate.length>0){
                    await db.Schedule.bulkCreate(toCreate)
                }
                resolve({
                    errCode:0,
                    message:'suceed!'
                })
            }
            
        }catch(err){
            reject(err)
        }
    })
}

let getScheduleDoctorByDate = (doctorId,date)=>{
    return new Promise(async(resolve, reject)=>{
        try{
            if(!doctorId||!date){
                resolve({
                    errCode:1,
                    message:'Missing requered parameters!'
                })
            }else{
                let data=await db.Schedule.findAll({
                    where:{
                        doctorId:doctorId,
                        date:date
                    },
                    include:[
                        {model:db.Allcode, as:'timeTypeData', attributes:['valueEn', 'valueVi']},
                    ], 
                    raw:true,
                    nest:true
                })
                
                if(!data) data=[]
                resolve({
                    errCode:0,
                    message:'succeed!',
                    data:data
                })
            }
        }catch(err){
            reject(err)
        }
    })
}
module.exports={
    getTopDoctorHomeService:getTopDoctorHomeService,
    getAllDoctor:getAllDoctor,
    saveInfoDoctor:saveInfoDoctor,
    getInfoDoctorById:getInfoDoctorById,
    bulkCreateSchdule:bulkCreateSchdule,
    getScheduleDoctorByDate,
}