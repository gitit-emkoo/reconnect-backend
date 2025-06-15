import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { Prisma } from '@prisma/client';
export declare class CommunityService {
    private prisma;
    constructor(prisma: PrismaService);
    createPost(createPostDto: CreatePostDto, authorId: string): Promise<{
        id: string;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        imageUrl: string | null;
        viewCount: number;
        tags: string[];
        poll: Prisma.JsonValue | null;
        authorId: string;
        categoryId: string;
    }>;
    getAllPosts(categoryId?: string, page?: number, limit?: number): Promise<{
        posts: {
            id: string;
            title: string;
            category: {
                id: string;
                name: string;
                isPollCategory: boolean;
            };
            createdAt: Date;
            _count: {
                comments: number;
            };
            content: string;
            tags: string[];
            poll: Prisma.JsonValue;
            author: {
                nickname: string;
            };
        }[];
        total: number;
    }>;
    findAll(categoryId?: string, search?: string, page?: number, limit?: number): Promise<{
        posts: {
            id: string;
            title: string;
            category: {
                id: string;
                name: string;
                isPollCategory: boolean;
            };
            createdAt: Date;
            _count: {
                comments: number;
            };
            content: string;
            tags: string[];
            poll: Prisma.JsonValue;
            author: {
                nickname: string;
            };
        }[];
        total: number;
    }>;
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
        imageUrl: string | null;
        viewCount: number;
        tags: string[];
        poll: Prisma.JsonValue | null;
        authorId: string;
        categoryId: string;
    }) | null>;
    createComment(postId: string, content: string, authorId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        communityPostId: string | null;
        journalId: string | null;
        parentId: string | null;
    }>;
    createReply(postId: string, parentId: string, content: string, authorId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        communityPostId: string | null;
        journalId: string | null;
        parentId: string | null;
    }>;
    updatePost(postId: string, updateData: any, userId: string): Promise<{
        id: string;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        imageUrl: string | null;
        viewCount: number;
        tags: string[];
        poll: Prisma.JsonValue | null;
        authorId: string;
        categoryId: string;
    }>;
    deletePost(postId: string, userId: string): Promise<{
        id: string;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        imageUrl: string | null;
        viewCount: number;
        tags: string[];
        poll: Prisma.JsonValue | null;
        authorId: string;
        categoryId: string;
    }>;
    voteOnPost(postId: string, userId: string, choice: number): Promise<{
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
