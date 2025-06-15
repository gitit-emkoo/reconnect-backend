export declare class CreatePostDto {
    title: string;
    content: string;
    categoryId: string;
    imageUrl?: string;
    tags?: string[];
    poll?: {
        question: string;
        options: string[];
    };
    isPollCategory?: boolean;
}
