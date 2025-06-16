import { CommunityService } from './community.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PrismaService } from '../prisma/prisma.service';
import { VoteDto } from './dto/vote.dto';
export declare class CommunityController {
    private readonly communityService;
    private readonly prisma;
    constructor(communityService: CommunityService, prisma: PrismaService);
    createPost(createPostDto: CreatePostDto, user: any): Promise<{
        id: string;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        categoryId: string;
        imageUrl: string | null;
        tags: string[];
        poll: import("@prisma/client/runtime/library").JsonValue | null;
        viewCount: number;
        authorId: string;
    }>;
    getAllPosts(categoryId?: string, search?: string, page?: number, limit?: number): Promise<{
        posts: {
            id: string;
            title: string;
            category: {
                id: string;
                name: string;
                isPollCategory: boolean;
            };
            createdAt: Date;
            content: string;
            _count: {
                comments: number;
            };
            tags: string[];
            poll: import("@prisma/client/runtime/library").JsonValue;
            author: {
                nickname: string;
            };
        }[];
        total: number;
    }>;
    getCategories(): Promise<{
        id: string;
        name: string;
    }[]>;
    getPostById(id: string): Promise<({
        category: {
            id: string;
            name: string;
            isPollCategory: boolean;
        };
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
        votes: {
            id: string;
            createdAt: Date;
            userId: string;
            option: string;
            postId: string;
        }[];
        author: {
            nickname: string;
        };
    } & {
        id: string;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        categoryId: string;
        imageUrl: string | null;
        tags: string[];
        poll: import("@prisma/client/runtime/library").JsonValue | null;
        viewCount: number;
        authorId: string;
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
        title: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        categoryId: string;
        imageUrl: string | null;
        tags: string[];
        poll: import("@prisma/client/runtime/library").JsonValue | null;
        viewCount: number;
        authorId: string;
    }>;
    deletePost(id: string, user: any): Promise<{
        id: string;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        categoryId: string;
        imageUrl: string | null;
        tags: string[];
        poll: import("@prisma/client/runtime/library").JsonValue | null;
        viewCount: number;
        authorId: string;
    }>;
    voteOnPost(postId: string, voteDto: VoteDto, user: any): Promise<{
        cancelled: boolean;
        changed?: undefined;
        created?: undefined;
    } | {
        changed: boolean;
        cancelled?: undefined;
        created?: undefined;
    } | {
        created: boolean;
        cancelled?: undefined;
        changed?: undefined;
    }>;
    getPollResult(postId: string): Promise<Record<string, number>>;
}
