<?php

namespace Backend\Types;

use Afeefa\ApiResources\DB\Medoo\B_a_id_Resolver;
use Afeefa\ApiResources\Field\FieldBag;
use Afeefa\ApiResources\Field\Fields\HasManyRelation;
use Afeefa\ApiResources\Field\Fields\LinkManyRelation;
use Afeefa\ApiResources\Field\Fields\VarcharAttribute;
use Afeefa\ApiResources\Type\ModelType;
use Afeefa\ApiResources\Validator\Validators\VarcharValidator;
use Backend\Resolvers\TagsResolver;

class AuthorType extends ModelType
{
    public static string $type = 'Example.AuthorType';

    protected function fields(FieldBag $fields): void
    {
        $fields->attribute('name', VarcharAttribute::class);

        $fields->attribute('email', VarcharAttribute::class);

        $fields->relation('articles', ArticleType::class, function (HasManyRelation $relation) {
            $relation->resolve(function (B_a_id_Resolver $r) {
                $r
                    ->aIdFieldName('author_id')
                    ->typeClass(ArticleType::class);
            });
        });

        $fields->relation('tags', TagType::class, function (LinkManyRelation $relation) {
            $relation->resolve([TagsResolver::class, 'resolve_tags_relation']);
        });
    }

    protected function updateFields(FieldBag $fields): void
    {
        $fields->get('name')
            ->validate(function (VarcharValidator $v) {
                $v
                    ->filled()
                    ->min(5)
                    ->max(101);
            });

        $fields->allow([
            'name'
        ]);
    }

    protected function createFields(FieldBag $fields): void
    {
        $fields->allow([
            'name'
        ]);
    }
}
