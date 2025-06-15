import { CommunityService } from './community.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class CommunityController {
    private readonly communityService;
    private readonly prisma;
    constructor(communityService: CommunityService, prisma: PrismaService);
    createPost(createPostDto: CreatePostDto, user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        title: string;
        imageUrl: string | null;
        viewCount: number;
        tags: string[];
        poll: import("@prisma/client/runtime/library").JsonValue | null;
        authorId: string;
        categoryId: string;
    }>;
    getAllPosts(categoryId?: string, search?: string, page?: number, limit?: number): Promise<{
        posts: {
            id: string;
            createdAt: Date;
            _count: {
                comments: number;
            };
            category: {
                name: string;
                id: string;
                isPollCategory: boolean;
            };
            content: string;
            title: string;
            tags: string[];
            poll: import("@prisma/client/runtime/library").JsonValue;
            author: {
                nickname: string;
            };
        }[];
        total: number;
    }>;
    getCategories(): Promise<{
        name: string;
        id: string;
    }[]>;
    getPostById(id: string): Promise<({
        comments: ({
            author: {
                nickname: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            authorId: string;
            communityPostId: string | null;
            journalId: string | null;
            parentId: string | null;
        })[];
        category: {
            name: string;
            id: string;
            isPollCategory: boolean;
        };
        author: {
            nickname: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        title: string;
        imageUrl: string | null;
        viewCount: number;
        tags: string[];
        poll: import("@prisma/client/runtime/library").JsonValue | null;
        authorId: string;
        categoryId: string;
    }) | null>;
    createComment(postId: string, content: string, user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        communityPostId: string | null;
        journalId: string | null;
        parentId: string | null;
    }>;
    createReply(postId: string, parentId: string, content: string, user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        communityPostId: string | null;
        journalId: string | null;
        parentId: string | null;
    }>;
    updatePost(id: string, updateData: any, user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        title: string;
        imageUrl: string | null;
        viewCount: number;
        tags: string[];
        poll: import("@prisma/client/runtime/library").JsonValue | null;
        authorId: string;
        categoryId: string;
    }>;
    deletePost(id: string, user: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        title: string;
        imageUrl: string | null;
        viewCount: number;
        tags: string[];
        poll: import("@prisma/client/runtime/library").JsonValue | null;
        authorId: string;
        categoryId: string;
    }>;
    voteOnPost(postId: string, option: string, user: any): Promise<{
        id: string;
        createdAt: Date;
        postId: string;
        option: string;
        userId: string;
    }>;
    getPollResult(postId: string): Promise<Record<string, number>>;
}
