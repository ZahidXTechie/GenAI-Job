const mongoose = require('mongoose');


const technicalQuestionsSchema = new mongoose.Schema({
     
    questions:
        {
            type: String,
            required: [true, 'Question is required']
        },
    intention:
        {
            type: String,
            required: [true, 'Intention is required']
        },
    answers:
        {
            type: String,
            required: [true, 'Answer is required']
        }
},{
    _id: false
})

const behavioralQuestionsSchema = new mongoose.Schema({

    questions:
        {
            type: String,
            required: [true, 'Question is required']
        },
    intention:
        {
            type: String,
            required: [true, 'Intention is required']
        },
    answers:
        {
            type: String,
            required: [true, 'Answer is required']
        }

},{
    _id: false
})

const skillGapsSchema = new mongoose.Schema({

    skill:{
        type: String,
        required: [true, 'Skill is required']
    },
    severity:{
        type:String,
        enum: ['low', 'medium', 'high'],
        required: [true, 'Severity is required']
        
    }

},{
    _id: false
})

const preparationPlanSchema = new mongoose.Schema({

    days:{
        type:Number,
        required: [true, 'Days is required']
    },
    focus:{
        type:String,
        required: [true, 'Focus is required']
    },
    tasks:{
        type:String,
        required: [true, 'Tasks is required']
    }

})

const interviewReportSchema = new mongoose.Schema({
    jobdescription: {
        type:String,
        required: [true, 'Job description is required']
    },
    resumepdf:{
        type:String
    },
    selfDescription:{
        type:String

    },
    matchscore:{
        type:Number,
        min:0,
        max:100
    },
    title:{
        type:String,
        required: [true, 'Title is required']
    },
    technicalQuestions:[technicalQuestionsSchema],
    behavioralQuestions:[behavioralQuestionsSchema],
    skillGaps:[skillGapsSchema],
    preparationPlan:[preparationPlanSchema],
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
}, {
    timestamps: true
})

const interviewReportModel = mongoose.model('InterviewReport', interviewReportSchema);

module.exports = interviewReportModel;