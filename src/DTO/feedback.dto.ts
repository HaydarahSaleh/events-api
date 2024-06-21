import {
    IsBoolean,
    IsIn,
    IsInt,
    IsNotEmpty,
    Max,
    Min,
    ValidateIf,
} from "class-validator";

export class FeedbackRatingDTO {
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;
}
export class FeedbackIsUsefulDTO {
    @IsBoolean()
    isUseful: boolean;

    @ValidateIf((feed) => !feed.isUseful)
    @IsNotEmpty()
    reason: string;
}
