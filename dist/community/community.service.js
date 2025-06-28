"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CommunityService = class CommunityService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPost(createPostDto, authorId) {
        const { title, content, categoryId, imageUrl, tags, poll, isPollCategory } = createPostDto;
        const category = await this.prisma.category.findUnique({
            where: { id: categoryId },
            select: { id: true, name: true, isPollCategory: true },
        });
        if (!category) {
            throw new common_1.BadRequestException('존재하지 않는 카테고리입니다.');
        }
        if (category.isPollCategory) {
            if (!poll || !poll.question || !poll.options || poll.options.length === 0) {
                throw new common_1.BadRequestException('투표 카테고리에는 투표 질문과 옵션이 필요합니다.');
            }
        }
        else {
            if (poll) {
                throw new common_1.BadRequestException('일반 카테고리에는 투표를 추가할 수 없습니다.');
            }
        }
        const data = {
            title,
            content,
            imageUrl,
            tags,
            author: { connect: { id: authorId } },
            category: { connect: { id: categoryId } },
        };
        if (category.isPollCategory && poll) {
            data.poll = {
                question: poll.question,
                options: poll.options.map(option => ({ text: option })),
            };
        }
        return this.prisma.communityPost.create({
            data,
        });
    }
    async getAllPosts(categoryId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [posts, total] = await Promise.all([
            this.prisma.communityPost.findMany({
                where: {
                    categoryId: categoryId ? categoryId : undefined,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                select: {
                    id: true,
                    title: true,
                    content: true,
                    tags: true,
                    createdAt: true,
                    poll: true,
                    author: {
                        select: {
                            nickname: true,
                        },
                    },
                    category: true,
                    _count: {
                        select: { comments: true },
                    },
                },
                skip,
                take: limit,
            }),
            this.prisma.communityPost.count({
                where: {
                    categoryId: categoryId ? categoryId : undefined,
                },
            }),
        ]);
        return { posts, total };
    }
    async findAll(categoryId, search, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const where = {};
        if (categoryId) {
            where.categoryId = categoryId;
        }
        if (search) {
            where.OR = [
                {
                    title: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
                {
                    content: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
                {
                    tags: {
                        has: search,
                    },
                },
            ];
        }
        const [posts, total] = await Promise.all([
            this.prisma.communityPost.findMany({
                where,
                orderBy: {
                    createdAt: 'desc',
                },
                select: {
                    id: true,
                    title: true,
                    content: true,
                    tags: true,
                    createdAt: true,
                    poll: true,
                    author: {
                        select: {
                            nickname: true,
                        },
                    },
                    category: true,
                    _count: {
                        select: { comments: true },
                    },
                },
                skip,
                take: limit,
            }),
            this.prisma.communityPost.count({ where }),
        ]);
        return { posts, total };
    }
    async getPostById(id) {
        await this.prisma.communityPost.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        });
        return this.prisma.communityPost.findUnique({
            where: { id },
            include: {
                author: { select: { nickname: true } },
                category: true,
                comments: {
                    include: { author: { select: { nickname: true } } }
                },
                votes: true
            }
        });
    }
    async createComment(postId, content, authorId) {
        return this.prisma.comment.create({
            data: {
                content,
                author: { connect: { id: authorId } },
                communityPost: { connect: { id: postId } }
            }
        });
    }
    async createReply(postId, parentId, content, authorId) {
        return this.prisma.comment.create({
            data: {
                content,
                author: { connect: { id: authorId } },
                communityPost: { connect: { id: postId } },
                parent: { connect: { id: parentId } },
            }
        });
    }
    async updatePost(postId, updateData, userId) {
        const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
        if (!post)
            throw new Error('게시글을 찾을 수 없습니다.');
        if (post.authorId !== userId)
            throw new Error('본인 글만 수정할 수 있습니다.');
        return this.prisma.communityPost.update({
            where: { id: postId },
            data: updateData,
        });
    }
    async deletePost(postId, userId) {
        const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
        if (!post)
            throw new Error('게시글을 찾을 수 없습니다.');
        if (post.authorId !== userId)
            throw new Error('본인 글만 삭제할 수 있습니다.');
        return this.prisma.communityPost.delete({ where: { id: postId } });
    }
    async voteOnPost(postId, userId, option) {
        const post = await this.prisma.communityPost.findUnique({
            where: { id: postId },
            select: { poll: true },
        });
        if (!post ||
            !post.poll ||
            typeof post.poll !== 'object' ||
            !('options' in post.poll) ||
            !Array.isArray(post.poll.options)) {
            throw new common_1.BadRequestException('투표가 가능한 게시글이 아닙니다.');
        }
        const pollData = post.poll;
        const isValidOption = pollData.options.some(opt => opt.text === option);
        if (!isValidOption) {
            throw new common_1.BadRequestException('유효하지 않은 투표 선택지입니다.');
        }
        const existingVote = await this.prisma.communityPostVote.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
        });
        if (existingVote && existingVote.option === option) {
            await this.prisma.communityPostVote.delete({
                where: {
                    userId_postId: {
                        userId,
                        postId,
                    },
                },
            });
            return { message: '투표가 취소되었습니다.' };
        }
        else {
            const data = await this.prisma.communityPostVote.upsert({
                where: {
                    userId_postId: {
                        userId,
                        postId,
                    },
                },
                update: { option },
                create: {
                    userId,
                    postId,
                    option,
                },
            });
            return { message: '투표가 반영되었습니다.', data };
        }
    }
    async getPollResult(postId) {
        const votes = await this.prisma.communityPostVote.groupBy({
            by: ['option'],
            where: { postId },
            _count: {
                option: true,
            },
        });
        const result = {};
        for (const group of votes) {
            result[group.option] = group._count.option;
        }
        return result;
    }
};
exports.CommunityService = CommunityService;
exports.CommunityService = CommunityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CommunityService);
//# sourceMappingURL=community.service.js.map