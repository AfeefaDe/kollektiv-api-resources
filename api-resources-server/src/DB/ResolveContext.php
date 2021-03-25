<?php

namespace Afeefa\ApiResources\DB;

use Afeefa\ApiResources\Api\RequestedFields;
use Afeefa\ApiResources\DI\ContainerAwareInterface;
use Afeefa\ApiResources\DI\ContainerAwareTrait;
use Afeefa\ApiResources\DI\DependencyResolver;
use Afeefa\ApiResources\Exception\Exceptions\InvalidConfigurationException;
use Afeefa\ApiResources\Type\Type;

class ResolveContext implements ContainerAwareInterface
{
    use ContainerAwareTrait;

    protected Type $type;

    protected RequestedFields $requestedFields;

    /**
     * @var RelationResolver[]
     */
    protected array $relationResolvers;

    public function type(Type $type): ResolveContext
    {
        $this->type = $type;
        return $this;
    }

    public function requestedFields(RequestedFields $requestedFields): ResolveContext
    {
        $this->requestedFields = $requestedFields;
        return $this;
    }

    /**
     * @param RelationResolver[] $relationResolvers
     */
    public function getSelectFields(Type $type = null): array
    {
        if (!isset($this->relationResolvers)) {
            $this->createRelationResolvers();
        }

        $requestedFields = $this->requestedFields;
        $type = $type ?: $requestedFields->getType();
        $relationResolvers = $this->relationResolvers;

        $selectFields = ['id'];

        foreach ($requestedFields->getFieldNames() as $fieldName) {
            if ($type->hasAttribute($fieldName)) {
                $selectFields[] = $fieldName;
            }

            if ($type->hasRelation($fieldName)) {
                $relationResolver = $relationResolvers[$fieldName];
                $selectFields = array_unique(
                    array_merge(
                        $selectFields,
                        $relationResolver->getOwnerIdFields()
                    )
                );
            }

            if (preg_match('/^\@(.+)/', $fieldName, $matches)) {
                $onTypeName = $matches[1];
                if ($type::$type === $onTypeName) {
                    $selectFields = array_unique(
                        array_merge(
                            $selectFields,
                            $this->getSelectFields($type, $requestedFields->getNestedField($fieldName), $relationResolvers)
                        )
                    );
                }
            }
        }

        return $selectFields;
    }

    public function getRelationResolvers(): array
    {
        return $this->relationResolvers;
    }

    /**
     * @return RelationResolver[]
     */
    protected function createRelationResolvers()
    {
        $requestedFields = $this->requestedFields;
        $type = $requestedFields->getType();

        $relationResolvers = [];
        foreach ($requestedFields->getFieldNames() as $fieldName) {
            if ($type->hasRelation($fieldName)) {
                $relation = $type->getRelation($fieldName);
                $resolveCallback = $relation->getResolve();

                /** @var RelationResolver */
                $relationResolver = null;

                if ($resolveCallback) {
                    $this->container->call(
                        $resolveCallback,
                        function (DependencyResolver $r) {
                            if ($r->isOf(RelationResolver::class)) {
                                $r->create();
                            }
                        },
                        function () use (&$relationResolver) {
                            $arguments = func_get_args();
                            foreach ($arguments as $argument) {
                                if ($argument instanceof RelationResolver) {
                                    $relationResolver = $argument;
                                }
                            }
                        }
                    );

                    if (!$relationResolver) {
                        throw new InvalidConfigurationException("Resolve callback for relation {$fieldName} on type {$type::$type} must receive a RelationResolver as argument.");
                    }

                    $relationResolver->relation($relation);
                    $relationResolver->requestedFields($requestedFields->getNestedField($fieldName));
                    $relationResolvers[$fieldName] = $relationResolver;
                } else {
                    throw new InvalidConfigurationException("Relation {$fieldName} on type {$type::$type} does not have a relation resolver.");
                }
            }
        }

        $this->relationResolvers = $relationResolvers;
    }
}