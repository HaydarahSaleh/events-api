import { IsNumber, IsOptional, IsJSON } from "class-validator";

export class SurveyAnswerCreateDTO {
    @IsNumber()
    surveyId: number;

    @IsJSON()
    answer: JSON;
}

export class SurveyAnswerUpdateDTO {
    @IsOptional()
    @IsNumber()
    surveyId: number;

    @IsOptional()
    @IsJSON()
    answer: JSON;
}
